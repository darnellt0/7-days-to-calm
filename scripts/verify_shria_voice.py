"""Read-only provider check for the published Shria voice and challenge isolation.

Run with em-backend's Python environment. No signed URLs or credentials are printed.
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

from challenge_workflow import protect_workflow

SHRIA_VOICE_ID = "DoEstgRs2aKZVhKhJhnx"


def verify(agent):
    def require(condition, message):
        if not condition:
            raise RuntimeError(message)

    tts = agent["conversation_config"]["tts"]
    require(tts["voice_id"] == SHRIA_VOICE_ID, "Published voice no longer matches saved Shria")
    require(not tts.get("supported_voices"), "Additional voices could allow voice switching")
    overrides = agent["platform_settings"]["overrides"]["conversation_config_override"]["tts"]
    require(not any(overrides.get(k) for k in ("voice_id", "model_id", "supported_voices")),
            "Client voice/model overrides must remain disabled")
    workflow = agent.get("workflow") or {}
    guarded_edges = 0
    for node in workflow.get("nodes", {}).values():
        if node["type"] == "override_agent":
            voice = ((node.get("conversation_config") or {}).get("tts") or {}).get("voice_id")
            require(voice in (None, SHRIA_VOICE_ID), "A workflow node overrides Shria's voice")
    for edge_id, edge in workflow.get("edges", {}).items():
        target = workflow["nodes"][edge["target"]]
        if target["type"] not in {"standalone_agent", "phone_number"}:
            continue
        # Rebuild the guard independently of its label to detect a stale/mislabelled condition.
        fixture = {"nodes": workflow["nodes"], "edges": {edge_id: {
            **edge, "forward_condition": {"type": "unconditional"}}}}
        expected, _ = protect_workflow(fixture)
        outside = expected["edges"][edge_id]["forward_condition"]["expression"]["children"][0]
        condition = edge["forward_condition"]
        expr = condition.get("expression") or {}
        children = expr.get("children") or []
        require(condition.get("type") == "expression" and expr.get("type") == "and_operator"
                and len(children) == 2 and children[0] == outside,
                "An alternate-agent/phone handoff lacks the days 1–7 guard")
        guarded_edges += 1
    return {"passed": True, "voice": "Shria", "voice_id": SHRIA_VOICE_ID,
            "guarded_handoffs": guarded_edges, "human_audio_approval": "not inferred"}


if __name__ == "__main__":
    load_dotenv(Path(__file__).resolve().parents[1] / "em-backend/.env")
    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"], timeout=25)
    agent_id = os.environ.get("AGENT_ID") or os.environ["ELEVENLABS_AGENT_ID"]
    agent = client.conversational_ai.agents.get(agent_id).model_dump(mode="json")
    print(json.dumps(verify(agent)))
