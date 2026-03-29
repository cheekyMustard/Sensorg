import { useState } from 'react';
import { useRequests } from '../hooks/useRequests.js';
import { useNotes } from '../hooks/useNotes.js';
import { useTasks } from '../hooks/useTasks.js';
import { useKb } from '../hooks/useKb.js';
import { useRepairRequests } from '../hooks/useRepairRequests.js';
import { useAuth } from '../context/AuthContext.jsx';
import DeliveriesSection from '../components/DeliveriesSection/DeliveriesSection.jsx';
import NotesSection from '../components/NotesSection/NotesSection.jsx';
import TasksSection from '../components/TasksSection/TasksSection.jsx';
import KbSection from '../components/KbSection/KbSection.jsx';
import RepairRequestsSection from '../components/RepairRequestsSection/RepairRequestsSection.jsx';
import AddModal from '../components/AddModal/AddModal.jsx';

export default function Home() {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState('deliveries');
  const [addMode, setAddMode] = useState(null); // 'delivery' | 'note' | 'task' | 'kb'

  const canSeeRepairs = user?.roles?.some(r => ['mechanic', 'admin'].includes(r));

  function toggle(id) {
    setOpenSection(cur => cur === id ? null : id);
  }

  const {
    requests, isLoading: reqLoading, error: reqError,
    hasNextPage, fetchNextPage, isFetchingNextPage,
  } = useRequests('active');
  const { data: notes          = [], isLoading: noteLoading,   error: noteError   } = useNotes();
  const { data: tasks          = [], isLoading: taskLoading,   error: taskError   } = useTasks();
  const { data: articles       = [], isLoading: kbLoading,     error: kbError     } = useKb();
  const { data: repairRequests = [], isLoading: repairLoading, error: repairError } = useRepairRequests();

  return (
    <>
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-(--bottom-nav-height)">
        <DeliveriesSection
          requests={requests}
          loading={reqLoading}
          error={reqError}
          hasMore={hasNextPage}
          loadMore={fetchNextPage}
          loadingMore={isFetchingNextPage}
          isOpen={openSection === 'deliveries'}
          onToggle={() => toggle('deliveries')}
          onAdd={() => setAddMode('delivery')}
        />
        {canSeeRepairs && (
          <RepairRequestsSection
            repairRequests={repairRequests}
            loading={repairLoading}
            error={repairError}
            isOpen={openSection === 'repairs'}
            onToggle={() => toggle('repairs')}
          />
        )}
        <NotesSection
          notes={notes} loading={noteLoading} error={noteError}
          isOpen={openSection === 'notes'} onToggle={() => toggle('notes')}
          onAdd={() => setAddMode('note')}
        />
        <TasksSection
          tasks={tasks} loading={taskLoading} error={taskError}
          isOpen={openSection === 'tasks'} onToggle={() => toggle('tasks')}
          onAdd={() => setAddMode('task')}
        />
        <KbSection
          articles={articles} loading={kbLoading} error={kbError}
          isOpen={openSection === 'kb'} onToggle={() => toggle('kb')}
          onAdd={() => setAddMode('kb')}
        />
      </main>

      <AddModal
        open={addMode !== null}
        onClose={() => setAddMode(null)}
        initialMode={addMode}
      />
    </>
  );
}
