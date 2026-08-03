# Withdrawal Approver Consent Requirement

## Request

The Approver consent checkbox must be mandatory before withdrawing a Kaizen.

## Scope

- Block the withdraw action when Approver consent is unchecked.
- Show a specific inline validation message under the checkbox.
- Reset consent validation whenever the withdrawal dialog is opened or closed.
- Keep the existing withdrawal function payload unchanged once consent is checked.

## Affected Files

- `src/pages/kaizens/show.tsx`

## Verification

- TypeScript check should pass.
- Clicking Withdraw without consent should not execute withdrawal.
- The dialog should show a clear consent-required message.
- Checking consent should allow withdrawal to continue.
