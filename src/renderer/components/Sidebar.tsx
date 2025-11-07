import LoginForm from "./LoginForm";
import ProgressBar from "./ProgressBar";
import LogViewer from "./LogViewer";
import Controls from "./Controls";

function Sidebar() {
  return (
    <div className="w-[350px] bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">Auto-T1</h1>
        <p className="text-sm text-gray-400">Automazione Web</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Login Form */}
        <LoginForm />

        {/* Controls */}
        <Controls />

        {/* Progress */}
        <ProgressBar />

        {/* Logs */}
        <LogViewer />
      </div>
    </div>
  );
}

export default Sidebar;
