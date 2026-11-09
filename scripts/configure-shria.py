"""Idempotently add challenge context without replacing Shria's existing guidance.

Run with em-backend's Python environment. Credentials stay in em-backend/.env.
The first run backs up the affected fields outside version control.
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "em-backend" / ".env")
client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
agent_id = os.environ["AGENT_ID"]
agent = client.conversational_ai.agents.get(agent_id)
config = agent.conversation_config.agent
marker = "[7 DAYS TO CALM CONTEXT]"
prompt = config.prompt.prompt or ""
defaults = dict(config.dynamic_variables.dynamic_variable_placeholders or {}) if config.dynamic_variables else {}
backup = ROOT / ".local" / "shria-agent-before.json"
if not backup.exists():
    backup.parent.mkdir(exist_ok=True)
    backup.write_text(json.dumps({"prompt": prompt, "first_message": config.first_message,
                                 "dynamic_variables": defaults}, indent=2), encoding="utf-8")

original_greeting = defaults.get("session_greeting") or config.first_message
if not original_greeting or original_greeting == "{{session_greeting}}":
    raise RuntimeError("Original greeting unavailable; restore it before configuring the agent")
defaults.update(challenge_day=0, challenge_title="", challenge_name="", session_greeting=original_greeting)
context = """
[7 DAYS TO CALM CONTEXT]
Session challenge day: {{challenge_day}}
Session challenge title: {{challenge_title}}
Session challenge name: {{challenge_name}}
When challenge_day is an integer from 1 through 7, this is a 7 Days to Calm session.
Prioritize that day's mindfulness practice over the general MenoPause Reset intake.
Reference the current day and theme naturally; do not ask which day they are on.
Day 1 Arrive: a gentle two-minute reset with breath and sound.
Day 2 Longer Exhale: offer a comfortable inhale for 4 and exhale for 6.
Day 3 Body Scan: guide attention from head to feet, releasing tension.
Day 4 Label Thoughts: notice thinking kindly and return to the breath.
Day 5 Box Breathing: optionally offer a gentle 4-4-4-4 rhythm.
Day 6 Open Awareness: notice sounds, touch, and breath without judgment.
Day 7 Integration: invite their favorite practice and reflect on the week.
Ask whether two, five, or eight minutes suits them, then guide the practice with
short, calm prompts and pauses. Keep breathing comfortable; breath holds are optional.
Adapt if they feel uncomfortable. Keep the existing boundaries and crisis guidance.
At the end, invite a brief reflection and suggest the page's Complete Day button.
Never claim progress was saved, a reminder scheduled, or a tool executed unless a
configured tool has actually confirmed it. Follow updated day context during a call.
If challenge_day is 0, missing, or outside 1 through 7, follow the existing general
coaching flow and greeting without introducing a challenge.
[/7 DAYS TO CALM CONTEXT]
"""
base_prompt = prompt.split(marker, 1)[0].rstrip()
client.conversational_ai.agents.update(agent_id, conversation_config={"agent": {
    "first_message": "{{session_greeting}}",
    "prompt": {"prompt": base_prompt + "\n\n" + context.strip()},
    "dynamic_variables": {"dynamic_variable_placeholders": defaults},
}})
saved = client.conversational_ai.agents.get(agent_id).conversation_config.agent
assert marker in saved.prompt.prompt
assert saved.first_message == "{{session_greeting}}"
assert saved.dynamic_variables.dynamic_variable_placeholders["challenge_day"] == 0
print("Shria challenge guidance and fallback greeting verified; credentials not displayed.")
