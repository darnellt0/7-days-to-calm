"""Read-only check for the selected Flash setup and voice isolation.

Run with em-backend's Python environment. No signed URLs or credentials are printed.
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

from challenge_workflow import protect_workflow

CANDIDATE_VOICE_ID = "DoEstgRs2aKZVhKhJhnx"
VOICE_SETTINGS = {"speed": 0.94, "stability": 0.30, "similarity_boost": 0.85}


def verify(agent):
    def require(condition, message):
        if not condition:
            raise RuntimeError(message)

    tts = agent["conversation_config"]["tts"]
    require(tts["voice_id"] == CANDIDATE_VOICE_ID, "Published voice differs from the selected Shria voice")
    # ElevenLabs' native English route requires v2, even with secondary languages.
    require(tts["model_id"] == "eleven_flash_v2", "English must use the selected Flash family")
    config = agent["conversation_config"]
    require(config["agent"]["language"] == "en", "English must remain the default")
    spanish = (config.get("language_presets") or {}).get("es", {}).get("overrides", {})
    require(spanish.get("agent", {}).get("language") == "es", "Spanish secondary language is missing")
    require(spanish.get("tts", {}).get("model_id") == "eleven_flash_v2_5", "Spanish must use Flash v2.5")
    require(spanish["tts"].get("voice_id") == CANDIDATE_VOICE_ID, "Spanish switches to another voice")
    for settings in (tts, spanish["tts"]):
        for key, value in VOICE_SETTINGS.items():
            actual = settings.get(key)
            require(isinstance(actual, (int, float)) and abs(actual - value) < 0.00001,
                    f"Voice setting changed: {key}")
        require(not settings.get("supported_voices"), "Additional voices could allow voice switching")
    overrides = agent["platform_settings"]["overrides"]["conversation_config_override"]["tts"]
    require(not any(overrides.get(k) for k in ("voice_id", "model_id", "supported_voices", *VOICE_SETTINGS)),
            "Client voice/model overrides must remain disabled")
    workflow = agent.get("workflow") or {}
    guarded_edges = 0
    for node in workflow.get("nodes", {}).values():
        if node["type"] == "override_agent":
            settings = ((node.get("conversation_config") or {}).get("tts") or {})
            require(settings.get("voice_id") in (None, CANDIDATE_VOICE_ID), "A workflow node overrides Shria's voice")
            require(settings.get("model_id") in (None, tts["model_id"]), "A workflow node overrides the Flash model")
            for key, value in VOICE_SETTINGS.items():
                require(settings.get(key) in (None, value), f"A workflow node overrides {key}")
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
    return {"passed": True, "configuration_checks_passed": True,
            "voice": "Shria", "voice_id": CANDIDATE_VOICE_ID,
            "english_model": "eleven_flash_v2", "spanish_model": "eleven_flash_v2_5",
            "native_english_flash_v2_5_available": False,
            "application_playback": "Check backend relay mode separately; it synthesizes English Turbo v2.5 when enabled",
            "guarded_handoffs": guarded_edges, "human_audio_approval": "Turbo v2.5 comparison preferred by user; complete practice continuity pending"}


if __name__ == "__main__":
    load_dotenv(Path(__file__).resolve().parents[1] / "em-backend/.env")
    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"], timeout=25)
    agent_id = os.environ.get("AGENT_ID") or os.environ["ELEVENLABS_AGENT_ID"]
    agent = client.conversational_ai.agents.get(agent_id).model_dump(mode="json")
    result = verify(agent)
    print(json.dumps(result))
    raise SystemExit(0 if result["passed"] else 1)
