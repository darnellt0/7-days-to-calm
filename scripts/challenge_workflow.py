"""Guard shared-agent handoffs: days 1–7 stay with Shria; general flows retain their conditions.

Expression format follows ElevenLabs' public OpenAPI AST schema. Default is dry-run.
Use em-backend's Python environment and --apply to save the guarded workflow.
"""
import argparse
from copy import deepcopy
import json
from pathlib import Path

LABEL = "General sessions only; keep 7 Days to Calm with Shria"


def protect_workflow(workflow):
    result = deepcopy(workflow)
    changed = []
    variable = {"type": "dynamic_variable", "name": "challenge_day"}
    outside_challenge = {"type": "or_operator", "children": [
        {"type": "lt_operator", "left": variable, "right": {"type": "number_literal", "value": 1}},
        {"type": "gt_operator", "left": variable, "right": {"type": "number_literal", "value": 7}},
    ]}
    for edge_id, edge in result.get("edges", {}).items():
        target = result.get("nodes", {}).get(edge["target"], {})
        if target.get("type") not in {"standalone_agent", "phone_number"}:
            continue
        condition = edge["forward_condition"]
        if condition.get("label") == LABEL:
            continue
        kind = condition.get("type")
        if kind == "llm":
            existing = {"type": "llm", "value_schema": {"type": "boolean", "description": condition["condition"]}}
        elif kind == "unconditional":
            existing = {"type": "boolean_literal", "value": True}
        elif kind == "expression":
            existing = condition["expression"]
        else:
            raise ValueError(f"Unsupported handoff condition: {kind}")
        edge["forward_condition"] = {"type": "expression", "label": LABEL,
            "expression": {"type": "and_operator", "children": [outside_challenge, existing]}}
        changed.append(edge_id)
    return result, changed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    import os
    from datetime import datetime, timezone
    from dotenv import load_dotenv
    from elevenlabs.client import ElevenLabs
    root = Path(__file__).resolve().parents[1]
    load_dotenv(root / "em-backend/.env")
    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"], timeout=25)
    agent_id = os.environ.get("AGENT_ID") or os.environ["ELEVENLABS_AGENT_ID"]
    agent = client.conversational_ai.agents.get(agent_id).model_dump(mode="json")
    defaults = agent["conversation_config"]["agent"]["dynamic_variables"]["dynamic_variable_placeholders"]
    if defaults.get("challenge_day") != 0:
        raise RuntimeError("Expected the shared agent's general-session challenge_day default to be 0")
    workflow, changed = protect_workflow(agent.get("workflow") or {})
    if args.apply and changed:
        backup = root / ".local/voice-audit"
        backup.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        (backup / f"workflow-before-{stamp}.json").write_text(json.dumps(agent["workflow"], indent=2), encoding="utf-8")
        client.conversational_ai.agents.update(agent_id, workflow=workflow)
        saved = client.conversational_ai.agents.get(agent_id).model_dump(mode="json")
        for edge_id in changed:
            assert saved["workflow"]["edges"][edge_id]["forward_condition"]["label"] == LABEL
        assert saved["conversation_config"]["tts"]["voice_id"] == agent["conversation_config"]["tts"]["voice_id"]
    print(json.dumps({"applied": bool(args.apply and changed), "guarded_edges": len(changed), "voice_unchanged": True}))


if __name__ == "__main__":
    main()
