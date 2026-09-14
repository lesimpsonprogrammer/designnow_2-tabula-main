# Teams Organization Builder — Test Cases

## License gating

1. Individual license: Organization and Settings controls are not shown.
2. Expired/suspended Teams license: Teams controls are not shown.
3. Active Teams license: role-appropriate Teams controls are shown.

## Org Admin

1. Incomplete setup opens Organization Builder after login.
2. Completed setup does not auto-open the Builder.
3. Org Admin can reopen the Builder from Start Screen and editor Header.
4. Org Admin can open Settings and manage role assignments.
5. Org Admin can approve/reject User Access Change requests.

## Site Admin

1. Site Admin cannot open Organization Builder.
2. Site Admin can open Settings in view-only mode.
3. Site Admin can submit a User Access Change request.
4. Site Admin cannot directly change role assignments or Asset Design approval.
5. Site Admin has no financial access, final-file approval, or project deletion authority.

## Section Leader

1. Section Leader is tied to one required section.
2. Section Leader cannot access Organization Builder or admin Settings.
3. Section Leader has no Asset Design Module access.

## Site Designer

1. Site Designer can be assigned to any section.
2. Asset Design Module access defaults off.
3. Only Org Admin can approve Site Designer Asset Design access.

## Logo Designer

1. Logo Designer receives Asset Design Module access reservation.
2. Logo Designer has no admin permissions.

## Persistence

1. Organization answers persist.
2. Template recommendation selection persists.
3. Environment selections persist.
4. Role assignments persist.
5. Returning to the Builder loads saved data.

## Regression

1. Existing project open/save behavior remains unchanged.
2. Momentum Data Solutions template opens normally.
3. Preview mode works normally.
4. Individual Edition behavior remains unchanged.
