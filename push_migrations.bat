@echo off
echo Linking Supabase project...
call npx supabase link --project-ref ddoocgpbnozlgazjojtf --password "PlaceHolderPasswordIfNeededOrItWillPrompt" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Link failed or already linked. Continuing...
)

echo Pushing migrations to remote database...
call npx supabase db push

if %ERRORLEVEL% EQU 0 (
    echo Migrations applied successfully.
) else (
    echo Error applying migrations. Check your connection or login status.
)
pause
