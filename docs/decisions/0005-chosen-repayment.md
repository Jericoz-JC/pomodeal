# 0005: Repayment stays chosen, with one-tap accept

Date: 2026-11-08 · Status: accepted

## Context

Spec 001 left an open question: should repaying borrowed break time be automatic (the next break shrinks) or chosen (the student picks borrow or trade)? The draft already makes the student choose from the second ask, and asked whether that is one tap too many at 11 PM. The big-ones research council looked at it while planning [spec 008](../specs/008-big-ones.md).

## Decision

- Repayment stays **chosen**. From the second ask, the student picks borrow (from the next break) or trade (into the next focus block).
- The option the student picked last time is **pre-selected**, so accepting is one tap.
- The terms themselves (amounts, floor, cap, ceiling) don't change.

Evidence behind it: the most cited complaint about Motion is AI re-planning the day without asking, while Sunsama lets users choose what carries forward. one sec's field study found that having the option to dismiss gave the strongest effect. Across the research, people stay when the terms are theirs.

## Consequences

- The last repayment choice is stored per user (`users.lastRepay`, spec 008) and the privacy inventory lists it.
- If dogfooding shows the second ask is still slow, the next step is a quicker default, not automatic repayment.
- Spec 001's open question is closed by this record.
