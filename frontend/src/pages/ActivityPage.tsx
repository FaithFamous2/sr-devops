import { Link } from 'react-router-dom';
import { useActivity } from '@/hooks/useActivity';

export function ActivityPage() {
  const { activities, removeActivity, clearActivities } = useActivity();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Secrets</h1>
          {activities.length > 0 && (
            <button
              onClick={clearActivities}
              className="btn btn-danger text-sm"
              aria-label="Clear all activities"
            >
              Clear All
            </button>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Secrets Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't created any secrets yet. Create your first secret to get started.
            </p>
            <Link to="/" className="btn btn-primary">
              🔐 Create a Secret
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">
                    {activity.id}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Created: {formatDate(activity.createdAt)}
                  </p>
                  <Link
                    to={`/secrets/${activity.id}`}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    View Secret →
                  </Link>
                </div>
                <button
                  onClick={() => removeActivity(activity.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label={`Remove secret ${activity.id}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {activities.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>ℹ️</span>
              This list is stored locally in your browser and only contains links, not the actual secret content.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
