import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../hooks/useToast';

export function DeleteAccount() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const { resetApp } = useAppStore();
  const { addToast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;

    setIsDeleting(true);

    try {
      await resetApp();
      setDeleteSuccess(true);
      addToast('All your data has been removed.', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      addToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="backdrop-blur-xl bg-gray-900/50 border border-red-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium mb-1">Warning: This action cannot be undone</p>
                <p className="text-sm text-gray-400">
                  Deleting your account will permanently remove all your data including transactions,
                  workouts, meals, body metrics, and goals.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400">
            If you want to keep a backup of your data, use the export feature before deleting.
          </p>

          <Button
            variant="danger"
            onClick={() => setShowConfirm(true)}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Data
          </Button>
        </CardContent>
      </Card>

      <Modal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setConfirmText('');
        }}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            This will permanently delete all your data. This action cannot be undone.
          </p>

          <p className="text-white">
            Type <span className="font-mono bg-gray-800 px-2 py-1 rounded">DELETE</span> to confirm:
          </p>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Type DELETE"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={confirmText !== 'DELETE'}
              isLoading={isDeleting}
              className="flex-1"
            >
              {deleteSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Deleted!
                </>
              ) : (
                'Delete Forever'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
