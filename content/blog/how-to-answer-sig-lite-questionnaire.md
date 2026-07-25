---
title: "How to Answer a SIG Lite Questionnaire (Without Losing a Week)"
description: "What a SIG Lite questionnaire actually is, who sends it, which sections eat the most time, and how to answer it accurately in hours instead of days."
slug: "how-to-answer-sig-lite-questionnaire"
date: "2026-07-25"
---

A customer just sent you a spreadsheet called something like "SIG Lite 2025" and your deal is now on hold until it comes back. If that's how you found this page, you're the exact person I wrote it for.

## What SIG Lite actually is

SIG stands for Standardized Information Gathering. It's a questionnaire framework published by Shared Assessments, and it exists so that companies evaluating vendors don't have to invent their own security questions from scratch. There are two main flavors: SIG Core, the long version, and SIG Lite, the condensed one that covers the same risk domains at a higher level.

"Lite" is doing a lot of work in that name. Depending on the version year, SIG Lite still runs well over a hundred questions across risk domains like access control, incident response, data protection, business resilience, third party management, and more recently AI usage. Banks, insurers, and large enterprises send it constantly because it lets them compare vendors on the same yardstick.

## Who fills it out at your company

If you're a small B2B team, the honest answer is: whoever got assigned the spreadsheet. Usually that's a founder, an engineering lead, or the one person who owns security part time. The first SIG Lite typically takes 15 to 30 hours, and almost none of that is writing. It's hunting. The answers live in five different places: your policies, your SOC 2 report if you have one, old questionnaires, your cloud console, and somebody's head.

## How to actually answer it

**Read the answer format first.** SIG questions are mostly yes, no, or not applicable, with a comments field. The comments field is where deals are won and lost. A bare "yes" on an important control invites follow-up questions. A "yes" plus one sentence pointing at your evidence usually closes the loop.

**Answer only what your documents can support.** This is the rule that matters more than any other. Every answer you give can be audited later, in a renewal review, in an incident postmortem, or in a courtroom. If your policy doesn't say it, don't claim it. "We are implementing this control, targeted for Q3" is a respectable answer. A confident yes you can't back up is how you turn a slow deal into a dead account.

**Watch the aspirational present tense.** The most common mistake I see isn't lying. It's writing "we conduct annual penetration tests" when you've done one, ever. Reviewers have read ten thousand of these. They can smell it.

**Not applicable is a real answer.** If you don't process cardholder data, the PCI questions are N/A. Say so and say why in one sentence. Answering questions that don't apply to you wastes your time and makes the reviewer wonder if you understood the rest.

**Flag what you can't answer instead of guessing.** Keep a running list of questions where you genuinely don't have an answer or the answer is embarrassing. Handle those deliberately at the end, with your team, not at 11pm on autopilot. Some of them deserve a roadmap answer. Some deserve a phone call with the customer's security team, which almost always goes better than you'd expect.

## The sections that eat the most time

In my experience the slow zones are third party management (you'll need your subprocessor list, current, with what data each one touches), access control (who has production access and how it's reviewed), incident response (they want your actual process and timelines, not "we take security seriously"), and business continuity (backup cadence, recovery objectives, last test date). If you prep those four areas before you start, the rest of the questionnaire moves fast.

## Doing this more than once

Here's the part nobody tells you: the second SIG Lite should take 2 to 3 hours, not 20. It only works out that way if you save your answers somewhere structured, with the evidence source attached to each one, so next time you're reviewing instead of excavating. Most teams intend to do this and never do, so every questionnaire costs like the first one.

That structured library is the entire reason VeriQuill exists. You upload the spreadsheet a customer sent, it drafts answers from your own approved answer library, cites where each answer came from, and flags anything your documents can't support instead of inventing something confident. Your first questionnaire is free, no card: [veriquill.app](https://veriquill.app)

Either way, whether you use a tool or a spreadsheet: keep the library. Future you, staring at questionnaire number six, will be grateful.
