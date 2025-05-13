import React, { useState, useEffect, useReducer, useCallback } from "react";

type Cue = {
  id: number;
  name: string;
  status: "learning" | "knows" | "mastered";
};
type CueAction =
  | { type: "ADD_CUE"; payload: { name: string } }
  | { type: "UPDATE_STATUS"; payload: { id: number; status: Cue["status"] } }
  | { type: "DELETE_CUE"; payload: { id: number } };

const cueReducer = (state: Cue[], action: CueAction): Cue[] => {
  switch (action.type) {
    case "ADD_CUE":
      return [
        ...state,
        { id: Date.now(), name: action.payload.name, status: "learning" },
      ];
    case "UPDATE_STATUS":
      return state.map((cue) =>
        cue.id === action.payload.id
          ? { ...cue, status: action.payload.status }
          : cue
      );
    case "DELETE_CUE":
      return state.filter((cue) => cue.id !== action.payload.id);
    default:
      return state;
  }
};

const useTimer = (initialTime: number) => {
  const [time, setTime] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    } else if (time === 0 && isActive) {
      setIsActive(false);
      Notification.requestPermission().then((perm) => {
        if (perm === "granted")
          new Notification("Training session complete! 🎉");
      });
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  return {
    time,
    isActive,
    start: () => {
      setTime(initialTime);
      setIsActive(true);
    },
    stop: () => setIsActive(false),
  };
};

const Header: React.FC = () => (
  <header className="bg-dog-blue text-white p-4 text-center rounded-lg shadow-md mb-6">
    <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
      <i className="fas fa-paw"></i> Paw-some Trainer
    </h1>
    <p className="text-sm md:text-base mt-2">
      Train your pup with love and consistency!
    </p>
  </header>
);

const CueForm: React.FC<{ onAdd: (name: string) => void }> = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Cue name is required");
      return;
    }
    if (name.length > 20) {
      setError("Cue name must be under 20 characters");
      return;
    }
    onAdd(name);
    setName("");
    setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add new cue (e.g., Sit)"
          className="p-2 border border-dog-purple rounded focus:outline-none focus:ring-2 focus:ring-dog-blue"
          aria-label="Add new training cue"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-dog-purple text-white p-2 rounded hover:bg-opacity-90 transition"
        >
          Add Cue
        </button>
      </div>
    </form>
  );
};

const CueList: React.FC<{
  cues: Cue[];
  onUpdateStatus: (id: number, status: Cue["status"]) => void;
  onDelete: (id: number) => void;
}> = ({ cues, onUpdateStatus, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-6">
    <h2 className="text-lg font-semibold mb-4 text-dog-blue">Training Cues</h2>
    {cues.length === 0 ? (
      <p className="text-gray-500">
        No cues added yet. Start by adding one above!
      </p>
    ) : (
      <ul className="space-y-2">
        {cues.map((cue) => (
          <li
            key={cue.id}
            className="flex items-center justify-between p-2 border-b"
          >
            <span>{cue.name}</span>
            <div className="flex items-center gap-2">
              <select
                value={cue.status}
                onChange={(e) =>
                  onUpdateStatus(cue.id, e.target.value as Cue["status"])
                }
                className="p-1 border rounded"
                aria-label={`Status for ${cue.name}`}
              >
                <option value="learning">Learning</option>
                <option value="knows">Knows</option>
                <option value="mastered">Mastered</option>
              </select>
              <button
                onClick={() => onDelete(cue.id)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Delete ${cue.name}`}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Timer: React.FC = () => {
  const timers = [useTimer(30), useTimer(60), useTimer(90)];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold mb-4 text-dog-blue">
        Training Timer
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {timers.map((timer, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={`text-2xl font-bold ${
                timer.isActive ? "text-dog-purple" : "text-gray-500"
              }`}
            >
              {timer.time}s
            </div>
            <button
              onClick={timer.start}
              disabled={timer.isActive}
              className="bg-dog-blue text-white p-2 rounded hover:bg-opacity-90 transition disabled:opacity-50"
            >
              Start {30 * (i + 1)}s
            </button>
            <button
              onClick={timer.stop}
              disabled={!timer.isActive}
              className="text-dog-purple hover:text-opacity-80 disabled:opacity-50"
            >
              Stop
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const RandomCuePicker: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const [randomCue, setRandomCue] = useState<Cue | null>(null);

  const pickRandomCue = useCallback(() => {
    if (cues.length === 0) return;
    const cue = cues[Math.floor(Math.random() * cues.length)];
    setRandomCue(cue);
    Notification.requestPermission().then((perm) => {
      if (perm === "granted")
        new Notification(`Practice: ${cue.name}`, { icon: "/favicon.ico" });
    });
  }, [cues]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-dog-blue">
        Random Cue Picker
      </h2>
      <button
        onClick={pickRandomCue}
        disabled={cues.length === 0}
        className="bg-dog-purple text-white p-2 rounded w-full hover:bg-opacity-90 transition disabled:opacity-50 mb-4"
      >
        Pick Random Cue
      </button>
      {randomCue ? (
        <div className="text-center p-4 bg-dog-blue/10 rounded">
          <p className="text-lg font-semibold">{randomCue.name}</p>
          <p className="text-sm text-gray-600">Status: {randomCue.status}</p>
        </div>
      ) : (
        <p className="text-gray-500 text-center">No cue selected</p>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [cues, dispatch] = useReducer(cueReducer, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <CueForm
          onAdd={(name) => dispatch({ type: "ADD_CUE", payload: { name } })}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CueList
              cues={cues}
              onUpdateStatus={(id, status) =>
                dispatch({ type: "UPDATE_STATUS", payload: { id, status } })
              }
              onDelete={(id) =>
                dispatch({ type: "DELETE_CUE", payload: { id } })
              }
            />
            <RandomCuePicker cues={cues} />
          </div>
          <Timer />
        </div>
      </div>
    </div>
  );
};

export default App;
