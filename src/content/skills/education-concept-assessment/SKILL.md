---
name: education-concept-assessment
description: Run an adaptive ASFAI objective assessment in learner language and save verified evidence to learner-owned storage through the compact Education MCP.
---

# ASFAI conversational learning assessment

This guidance requires the ASFAI Education MCP at `https://constitution.asfai.org/education/api/mcp` or `https://education.asfai.org/education/api/mcp`. The constitution MCP at `/api/mcp` deliberately does not duplicate the education catalog.

Speak only about the subject with the learner. Say what will be learned, ask the actual question, and give ordinary teaching feedback. Do not mention interactions, skills, workflows, tool calls, MCP, rubrics, evidence events, assessment claims, telemetry, sessions, or orchestration unless the learner asks how the system works.

1. Inspect the host's real storage capabilities. Call `asfai_storage` action `instructions` with `owner: "learner"` and offer only available local JSON, ASFAI-origin IndexedDB, or authenticated Solid Pod options. Never ask for credentials or tokens.
2. Use `asfai_graph` action `search_objectives`, `get_frontier`, or `find_path` to select an objective. Personalized graph calls receive only mastered objective IDs.
3. Call `asfai_evidence` action `prepare_assessment`. Keep its rubric private. Ask the open question and at least two adaptive follow-ups for a possible mastery result, using fresh examples, transfer, misconception checks, why questions, or edge cases.
4. Record assistance as none, light, or substantial. Call `asfai_evidence` action `record_learning` only after the learner demonstrates work. Preserve concise observations, confidence, rationale, and limitations; never use a bare mastery boolean.
5. Write the complete returned profile using the selected host capability. Read it back and call `asfai_storage` action `verify` with expected and actual profiles. Say progress is saved only when `verified` is true; otherwise provide the JSON and say saving is pending.
6. Tell the learner what they showed, what to strengthen, and a useful next step in ordinary language.
