---
auth: Eugene Yakhnenko
title: "The Art of Juggling Tech Debt While Shipping Features"
pubDatetime: 2026-01-06T12:00:00Z
featured: true
slug: handling-tech-debt
tags:
  - development
  - tech-debt
  - productivity
  - best-practices
description: "A practical, friendly guide to handling bugs, tech debt, and unexpected issues during feature development without losing your mind."
---

Picture this: You're halfway through building that exciting new feature everyone's been asking for. You're in the zone. The code is flowing. And then... you discover a bug. Not in your new code—in the old system your feature depends on. What do you do? Fix it now? File a ticket and move on? Pretend you didn't see it? Is it actually a bug or is it a bug in your understanding of the requirements?

If you've been there (and honestly, who hasn't?), you know this moment of choice happens constantly during development. The reality of building software isn't a clean, linear path from requirements to deployment. It's more like exploring a house where opening one door reveals three more doors you didn't know existed, and sometimes those doors are stuck.

Let's talk about how to handle this reality without burning out, missing deadlines, or letting your codebase turn into a maintenance nightmare.

## Why This Matters More Than You Think

Here's a sobering fact: when you switch from working on your feature to investigating that bug, it takes your brain about a good amount of time to fully get back into the zone afterward. Not the five minutes you hoped. For a team getting interrupted multiple times a day, that's anywhere from 10-20 hours of lost productivity every week.

And it's not just about time. Studies show that interrupted tasks take twice as long to complete and contain twice as many errors. It's a vicious cycle: poor code quality from interrupted work creates new bugs, which create more interruptions, which create more poor code.

But here's some good news: teams that handle these interruptions well don't eliminate them (that's impossible). They build systems to manage them efficiently.

## First Things First: Not Everything is Urgent

The fastest way to chaos is treating every discovered issue like a five-alarm fire. Most things aren't. You need a simple way to decide what actually needs your attention right now.

Here's a framework that works:

**P0/Critical**: System crashes, data loss, security breaches. Drop everything.

**P1/High**: Significant features broken but workarounds exist. Handle this sprint or immediately after.

**P2/Medium**: Degraded experience but not blocking. Can wait until next sprint if needed.

**P3/Low**: Cosmetic issues, minor UX friction. Backlog material.

The key word here is "actually." Is this _actually_ critical, or does it just feel urgent because you discovered it today?

A helpful trick: use RICE scoring for the gray areas. Score each issue on Reach (how many users), Impact (how badly affected), Confidence (how sure you are), and Effort (how hard to fix). Then calculate: `(Reach × Impact × Confidence) / Effort`. Higher scores win. This removes emotion from the decision.

## Plan for the Unexpected (Because It Will Happen)

Here's where some teams go wrong: they plan sprints as if nothing unexpected will happen. Every hour is allocated to planned work. When interruptions inevitably arrive, the sprint explodes.

Successful teams build buffer into every sprint:

- **10-15% Corporate overhead**: Meetings, emails, ceremonies
- **60-75% Planned work**: Your actual features
- **10-15% Unplanned work**: The buffer for surprises

> "But that means we'll deliver less!"

I hear you saying. Actually, no. You'll deliver _more consistently_ because you're planning realistically. Some sprints, you'll have fewer interruptions and pull ahead. Others, you'll use the full buffer. Over time, it averages out—but without the constant feeling of failure.

How much buffer do you need? It depends on the team, product, and environment: Track your actual interrupt load for a few sprints and adjust accordingly.

## The Superman Strategy: Protecting Focus Time

For teams dealing with production systems or customer support, here's a game-changer: the **Superman rotation**.

Instead of spreading interrupts across everyone (death by a thousand distractions), one person handles all interrupts for a set period—a week, a sprint, whatever makes sense. Everyone else gets uninterrupted focus time.

Yes, one person's productivity takes a hit. But the rest of the team's productivity _increases_, and the net result is usually positive. Plus, the Superman builds deep knowledge of system issues and common problems.

Keys to making this work:

- **Rotate fairly**: Nobody should be permanently on interrupt duty
- **Provide backup**: Have a secondary person for escalation
- **Be realistic**: Junior developers might need help; that's okay
- **Give them side work**: They can tackle documentation, tools, or admin tasks between interrupts

## Turn Fires Into Fireproofing

The difference between reactive and proactive teams isn't that proactive teams have fewer problems. It's that they prevent the same problem from happening twice.

After any major issue, follow this pipeline:

1. **Fix the immediate problem** (the symptom)
2. **Conduct a quick Root Cause Analysis** within 24-48 hours: Why did this happen? Was it missing tests? Unclear requirements? Architecture gap?
3. **Create a prevention artifact**: A runbook, automated test, monitoring rule, or architectural change
4. **Track and prioritize improvements**: Work the highest-impact, lowest-effort ones into your tech debt time

Example: Payment processing bug blocks the team. Don't just fix it, ask why your tests didn't catch it. Should there be integration tests? Add them. Document the scenario. Set up monitoring. Now it won't happen again.

## Protect Your Brain: Reduce Context Switching

Even well-managed interrupts cause context switching. Here's how to minimize the damage:

**Reserve focus time blocks**: Many teams reserve specific hours as interrupt-free. No meetings, no Slack questions (unless production is literally on fire). Make it a team norm.

**Set response time expectations**:

- Interrupt now (call, DM): Production down, security breach
- Same-day response: Code reviews, sprint blockers (within 8 hours)
- Next-day response: General questions, non-urgent bugs (within 24 hours)
- Async only: Status updates, docs (no immediate response needed)

**Limit work-in-progress**: One or two active items per developer, maximum. Finish before starting new work. It feels slower but actually speeds things up.

## The Missing Requirements Problem

Sometimes the "issue" isn't a bug—it's that you start building and realize the requirements were incomplete. This happens _constantly_. If you are not breaking things, you are not solving hard problems, and incomplete requirements are part of that.

Three-tier response:

1. **Critical path clarification**: If it blocks current work, pause and clarify immediately with your product owner. This should be a 30-minute conversation, not a three-day delay.

2. **Scope decision**: Is this part of the current feature? If yes, add it. If no, capture it for later.

3. **Document for next time**: Update your requirements template so this gap doesn't recur.

Don't fall into the false choice between "delay everything for perfect requirements" and "build something incomplete." Address blocking gaps now; defer the rest.

## Measure What Matters

How do you know if your interrupt management is working? Track:

- **Cycle time**: How long from issue discovery to fix? Faster is better.
- **Deployment frequency**: Are you shipping consistently or sporadically?
- **Bug escape rate**: What percentage of bugs reach production?
- **Developer satisfaction**: Survey your team on focus time and stress levels.

If any of these are trending wrong, your process needs adjustment.

## Common Traps to Avoid

**Priority inflation**: If 50% of your issues are "P0 critical," your definitions are broken. Typically, 5-10% should be P0.

**Treating interrupts as planning failure**: They're not. They're inevitable in live software. The question is how you handle them.

**Permanent interrupt duty**: Rotate fairly or you'll burn people out.

**Skipping root cause analysis**: Fixing the 20th payment bug without understanding why they keep happening means you're firefighting forever. Take the time to prevent recurrence.

**Process creep**: Don't add so much overhead that the meetings about interrupts are worse than the interrupts themselves.

## Start Simple

You don't need to implement everything at once. Here is a simple four-week plan to get started:

**Week 1**:

- Define your priority levels and share with the team
- Reserve 10-20% of your sprint for unplanned work
- Start a weekly 15-minute triage meeting

**Week 2-3**:

- Try Superman rotation if your team handles interrupts
- Protect time blocks as focus time
- Set max 2 active items per developer

**Week 4+**:

- Do root cause analysis on major issues
- Track your metrics
- Adjust based on what you learn

## The Bottom Line

Building software means dealing with unexpected issues. The question is not if unexpected issues will happen (they will), but rather when.

Teams that excel at this aren't more talented or better equipped. They just accept reality and build around it: clear prioritization, reserved capacity, focused triage, root cause prevention, and protected focus time.

Your codebase will never be perfect. There will always be tech debt, bugs, and surprises. But with the right system, you can ship features, maintain quality, and keep your team healthy.

The best time to start was yesterday. The second-best time is right now.
