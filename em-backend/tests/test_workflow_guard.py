import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from challenge_workflow import protect_workflow


def evaluate(node, day, original=True):
    kind = node["type"]
    if kind == "dynamic_variable": return day
    if kind in {"number_literal", "boolean_literal"}: return node["value"]
    if kind == "llm": return original
    if kind == "or_operator": return any(evaluate(child, day, original) for child in node["children"])
    if kind == "and_operator": return all(evaluate(child, day, original) for child in node["children"])
    left, right = evaluate(node["left"], day, original), evaluate(node["right"], day, original)
    if kind == "lt_operator": return left < right
    if kind == "gt_operator": return left > right
    raise AssertionError(kind)


class WorkflowGuardTests(unittest.TestCase):
    def setUp(self):
        self.source = {"nodes": {"coach": {"type": "override_agent"}, "lead": {"type": "standalone_agent"}},
            "edges": {"handoff": {"source": "coach", "target": "lead",
                "forward_condition": {"type": "llm", "condition": "Original business condition"}, "backward_condition": None}}}

    def test_all_seven_days_block_handoff_even_when_llm_requests_it(self):
        guarded, _ = protect_workflow(self.source)
        expr = guarded["edges"]["handoff"]["forward_condition"]["expression"]
        for day in range(1, 8):
            self.assertFalse(evaluate(expr, day, True))

    def test_general_sessions_preserve_original_condition(self):
        guarded, _ = protect_workflow(self.source)
        expr = guarded["edges"]["handoff"]["forward_condition"]["expression"]
        self.assertTrue(evaluate(expr, 0, True))
        self.assertFalse(evaluate(expr, 0, False))

    def test_idempotent_and_does_not_mutate_input(self):
        guarded, changed = protect_workflow(self.source)
        self.assertEqual(changed, ["handoff"])
        self.assertEqual(self.source["edges"]["handoff"]["forward_condition"]["type"], "llm")
        self.assertEqual(protect_workflow(guarded), (guarded, []))


if __name__ == "__main__":
    unittest.main()
