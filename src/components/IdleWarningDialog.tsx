import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface IdleWarningDialogProps {
  /** Drives the AlertDialog open/closed state. */
  open: boolean;
  /** Live countdown shown inside the description. */
  secondsRemaining: number;
  /** "Stay signed in" — keep the session, reset idle timer. */
  onStay: () => void;
  /** "Sign out now" — go straight to logout without waiting out the countdown. */
  onLogout: () => void;
}

/**
 * Inactivity warning shown at idle - warnMs. Built on AlertDialog (not
 * Dialog) so Esc / outside-click cannot dismiss it silently — the user
 * has to make an explicit choice.
 */
export const IdleWarningDialog = ({
  open,
  secondsRemaining,
  onStay,
  onLogout,
}: IdleWarningDialogProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You'll be signed out soon</AlertDialogTitle>
          <AlertDialogDescription>
            For your security we sign you out after 15 minutes of inactivity.
            Signing out in{' '}
            <span
              aria-live="polite"
              aria-atomic="true"
              className="font-display font-semibold text-foreground"
            >
              {secondsRemaining}
            </span>{' '}
            second{secondsRemaining === 1 ? '' : 's'}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Sign out now</AlertDialogCancel>
          <AlertDialogAction onClick={onStay} autoFocus>
            Stay signed in
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
