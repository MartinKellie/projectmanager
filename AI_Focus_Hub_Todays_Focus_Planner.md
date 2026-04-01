AI Focus Hub

Today’s Focus – AI-Assisted Planning System

1\. Purpose



The Today’s Focus system converts project-level reality into a small, executable daily plan (3–5 actions).



It balances:



Objective risk (deadlines + financial bleed)



Momentum (confidence + recent progress)



User intent (stated at daily startup)



AI assists.

User retains authority.



Primary constraint:



The system must reduce chaos without becoming bossy.



2\. Core Design Principles



AI never auto-reprioritizes silently.



User selections always win.



Max 5 actions surfaced for today.



Tone is calm, warm, never authoritarian.



Planner is optional but encouraged.



System must function without AI enabled.



3\. Daily Flow

3.1 Daily Startup Ritual



On first login of the day:



Show full-screen modal:



“What do you want to make progress on today?”



User may:



Enter intent text



Soft skip



Persist in dailyIntent.



3.2 Plan Bias Prompt



Immediately after intent:



Prompt:



“How should I bias today’s plan?”



Options:



Risk-first



Balanced



Momentum-first



Persist as:



dailyIntent.planBias



Optional toggle:



“Protect deep work” (boolean)



4\. “Plan My Day” Button



The Today column includes a primary action button:



Button Label:



Plan My Day



Behavior:



When pressed:



Gather project signals



Gather existing actions



Apply ranking logic



Generate proposed 3–5 actions



Display suggestions with rationale



Allow conversational refinement



The planner does NOT auto-run without user interaction.



It is intentionally user-triggered.



5\. Planner Inputs

5.1 Project Signals



For each active project:



Deadline proximity



Financial pain indicator



Confidence score



Days since last touched



Actions completed last 7 days



Time logged last 7 days



5.2 Today Signals



dailyIntent.intentText



dailyIntent.planBias



Calendar availability context (lightweight only)



5.3 Action Pool



Existing surfacedToday actions



Next action per project



Backlog actions (optional)



Ad-hoc actions



6\. Ranking Logic

6.1 Deterministic Heuristic Score



Each project receives a weighted score composed from:



Deadline pressure



Financial pain



Staleness



Confidence (inverse weighting allowed)



Momentum



Weighting depends on bias:



Risk-first



Deadline + financial dominate.



Balanced



Mixed weighting across all signals.



Momentum-first



Staleness + recent progress weighted higher.



6.2 AI Refinement Layer



AI may:



Choose smallest meaningful step



Prefer momentum-restoring actions



Suggest cutting overload



Detect avoidance patterns



AI may NOT:



Change project fields



Override surfacedToday list



Exceed 5 actions



Modify confidence automatically



7\. Planner Output

7.1 Proposed Action List



3–5 actions



Mix of:



Project-bound



Ad-hoc



Each includes 1-line rationale



Example:



“Advance Client X API – reduces deadline risk (3 days left).”



7.2 Tension Callouts



If signals conflict, display:



“Intent focuses on X, but Project Y is nearing deadline.”



“Confidence low on Project Z with high financial exposure.”



These are informational only.



7.3 Focus Anchor



AI proposes:



“If you do nothing else today, move this forward: \[Project]”



User may:



Accept



Replace



Ignore



Persist in:



dailyPlan.anchorProjectId

8\. Conversational Refinement



Under the proposed list:



Inline chat interface.



User can respond naturally:



“Too heavy. Lighten it.”



“Quick wins first.”



“Ignore finance today.”



“Swap the admin task.”



AI re-composes list accordingly.



All exchanges stored in aiEvents.



9\. Completion Flow



When user completes an action:



Mark complete



Update project.lastTouchedAt



Trigger next-step suggestion



Offer:



Continue same project



Switch to next ranked action



No automatic reshuffle.



10\. Data Model Additions



Add new collection:



dailyPlan

id (date-based)

userId

planBias

anchorProjectId (nullable)

proposedActionIds (array)

finalActionIds (array)

createdAt

updatedAt

11\. UI Structure (Middle Column)



Order from top to bottom:



Intent Card



Plan Bias Selector



Plan My Day Button



Proposed Actions Card



Conversational AI Card



Today Actions List (final, capped at 5)



Wins / Progress Card (completed today)



12\. Guardrails



No auto-run planning.



No more than 5 final actions.



User can override any suggestion.



Planner never overwrites manual pins.



If user ignores planner, system still functions.



13\. Failure Handling



If user skips planning:



System remains manual.



No nagging.



Gentle suggestion next login:



“Want help shaping today?”



14\. Success Criteria



The planning system succeeds if:



Daily action lists feel realistic.



High-risk projects are surfaced early.



Momentum is preserved.



User feels guided, not controlled.



Failure modes:



Overloaded action list



Excessive AI verbosity



Silent reprioritization



Guilt-inducing tone

