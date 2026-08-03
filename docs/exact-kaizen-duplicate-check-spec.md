# Exact Kaizen Duplicate Check

## Objective

Prevent submission when an existing submitted Kaizen has the same normalized
title, client, and process.

## Match rule

A record is an exact duplicate only when all of these conditions are true:

- title matches after trimming, collapsing whitespace, and ignoring case
- `client_id` matches
- normalized `process_name` matches
- the existing record is not `Draft` or `Withdrawn`
- the existing record is not the Kaizen currently being edited

The check runs before the submit function is called. Draft saving remains
allowed. When a duplicate is found, submission stops and the existing Kaizen
reference is shown through the configured Refine notification provider.

## Affected file

- `src/pages/kaizens/form.tsx`
