import React, { useState, useEffect, useReducer, useCallback } from "react";

// Types
type Dog = {
  id: number;
  name: string;
  imageUrl?: string;
};

type Cue = {
  id: number;
  name: string;
  status: "learning" | "knows" | "mastered";
  lastPracticed: string | null; // ISO date string
  dogId: number;
};

type AppState = {
  dogs: Dog[];
  cues: Cue[];
  activeDogId: number | null;
};

type AppAction =
  | { type: "ADD_DOG"; payload: { name: string; imageUrl?: string } }
  | { type: "SET_ACTIVE_DOG"; payload: { id: number } }
  | { type: "ADD_CUE"; payload: { name: string; dogId: number } }
  | { type: "UPDATE_CUE_STATUS"; payload: { id: number; status: Cue["status"] } }
  | { type: "DELETE_CUE"; payload: { id: number } }
  | { type: "PRACTICE_CUE"; payload: { id: number } };

// Local Storage
const LOCAL_STORAGE_KEY = "pawsomeTrainerData";

const loadStateFromStorage = (): AppState => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e);
  }
  
  // Default state with one dog
  const defaultDogId = 1;
  return {
    dogs: [{ id: defaultDogId, name: "My Dog" }],
    cues: [],
    activeDogId: defaultDogId
  };
};

const saveStateToStorage = (state: AppState) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  let newState: AppState;
  
  switch (action.type) {
    case "ADD_DOG":
      // Always replace "My Dog" if it exists
      const newDog = { 
        id: Date.now(), 
        name: action.payload.name, 
        imageUrl: action.payload.imageUrl 
      };
      
      // Filter out "My Dog" and add the new dog
      const updatedDogs = state.dogs
        .filter(dog => dog.name !== "My Dog")
        .concat(newDog);
      
      newState = {
        ...state,
        dogs: updatedDogs,
        activeDogId: newDog.id
      };
      break;
      
    case "SET_ACTIVE_DOG":
      newState = {
        ...state,
        activeDogId: action.payload.id
      };
      break;
      
    case "ADD_CUE":
      newState = {
        ...state,
        cues: [
          ...state.cues,
          {
            id: Date.now(),
            name: action.payload.name,
            status: "learning",
            lastPracticed: null,
            dogId: action.payload.dogId
          }
        ]
      };
      break;
      
    case "UPDATE_CUE_STATUS":
      newState = {
        ...state,
        cues: state.cues.map(cue =>
          cue.id === action.payload.id
            ? { ...cue, status: action.payload.status }
            : cue
        )
      };
      break;
      
    case "DELETE_CUE":
      newState = {
        ...state,
        cues: state.cues.filter(cue => cue.id !== action.payload.id)
      };
      break;
      
    case "PRACTICE_CUE":
      newState = {
        ...state,
        cues: state.cues.map(cue =>
          cue.id === action.payload.id
            ? { ...cue, lastPracticed: new Date().toISOString() }
            : cue
        )
      };
      break;
      
    default:
      return state;
  }
  
  // Save to localStorage after each action
  saveStateToStorage(newState);
  return newState;
};

// Hooks
const useTimer = (initialMinutes: number, initialSeconds: number) => {
  const totalInitialSeconds = initialMinutes * 60 + initialSeconds;
  const [seconds, setSeconds] = useState(totalInitialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      Notification.requestPermission().then(perm => {
        if (perm === "granted")
          new Notification("Training session complete! 🎉");
      });
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  // Format as MM:SS
  const displayMinutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  const formattedTime = `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;

  return {
    seconds,
    formattedTime,
    isActive,
    start: () => {
      setSeconds(totalInitialSeconds);
      setIsActive(true);
    },
    stop: () => setIsActive(false)
  };
};

// Components
const Header: React.FC<{
  dogs: Dog[];
  activeDogId: number | null;
  onSelectDog: (id: number) => void;
  onAddDog: (name: string) => void;
}> = ({ dogs, activeDogId, onSelectDog, onAddDog }) => {
  return (
    <header className="app-header">
      <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 mb-4 text-white">
        <i className="fas fa-paw"></i> Paw-some Trainer
      </h1>
      
      <p className="text-sm md:text-base text-white">
        Train your pup with love and consistency!
      </p>
    </header>
  );
};

const DogManager: React.FC<{
  dogs: Dog[];
  activeDogId: number | null;
  onSelectDog: (id: number) => void;
  onAddDog: (name: string) => void;
}> = ({ dogs, activeDogId, onSelectDog, onAddDog }) => {
  const [showAddDog, setShowAddDog] = useState(false);
  const [newDogName, setNewDogName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDogName.trim()) {
      setError("Dog name is required");
      return;
    }
    onAddDog(newDogName);
    setNewDogName("");
    setError("");
    setShowAddDog(false);
  };

  return (
    <div className="app-card">
      <div className="app-card-header">
        <i className="fas fa-dog"></i> Manage Dogs
      </div>
      <div className="app-card-body">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="dog-select" className="form-label">Select Dog</label>
              <select 
                id="dog-select"
                className="form-select w-full"
                value={activeDogId || ""}
                onChange={e => onSelectDog(Number(e.target.value))}
              >
                {dogs.map(dog => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name}
                  </option>
                ))}
              </select>
            </div>
            
            {!showAddDog ? (
              <button
                type="button"
                onClick={() => setShowAddDog(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-plus"></i> Add New Dog
              </button>
            ) : (
              <div>
                <label htmlFor="dog-name" className="form-label">Dog Name</label>
                <div className="flex gap-2">
                  <input
                    id="dog-name"
                    type="text"
                    value={newDogName}
                    onChange={e => setNewDogName(e.target.value)}
                    placeholder="Enter dog name"
                    className="form-input flex-grow"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="action-btn action-btn-success"
                    aria-label="Save"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDog(false);
                      setNewDogName("");
                      setError("");
                    }}
                    className="action-btn action-btn-cancel"
                    aria-label="Cancel"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

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
    <div className="app-card">
      <div className="app-card-header">
        <i className="fas fa-plus-circle"></i> Add New Cue
      </div>
      <div className="app-card-body">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="cue-name" className="form-label">Cue Name</label>
              <input
                id="cue-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Add new cue (e.g., Sit)"
                className="form-input"
                aria-label="Add new training cue"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <i className="fas fa-plus"></i> Add Cue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<{
  cues: Cue[];
  onUpdateStatus: (id: number, status: Cue["status"]) => void;
  onDelete: (id: number) => void;
  onPractice: (id: number) => void;
}> = ({ cues, onUpdateStatus, onDelete, onPractice }) => {
  // Group cues by status
  const cuesByStatus = {
    learning: cues.filter(cue => cue.status === "learning"),
    knows: cues.filter(cue => cue.status === "knows"),
    mastered: cues.filter(cue => cue.status === "mastered")
  };

  // Drag state
  const [draggedCue, setDraggedCue] = useState<number | null>(null);
  // Track which column is being dragged over
  const [dragOverColumn, setDragOverColumn] = useState<Cue["status"] | null>(null);
  
  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never practiced";
    
    const date = new Date(dateString);
    return `Last practiced: ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  // Drag handlers
  const handleDragStart = (e: React.DragEvent, cue: Cue) => {
    e.dataTransfer.setData("text/plain", cue.id.toString());
    setDraggedCue(cue.id);
  };
  
  const handleDragOver = (e: React.DragEvent, columnStatus: Cue["status"]) => {
    e.preventDefault(); // Allows dropping
    setDragOverColumn(columnStatus);
  };
  
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };
  
  const handleDrop = (e: React.DragEvent, newStatus: Cue["status"]) => {
    e.preventDefault();
    const cueId = Number(e.dataTransfer.getData("text/plain"));
    onUpdateStatus(cueId, newStatus);
    setDraggedCue(null);
    setDragOverColumn(null);
  };
  
  const handleDragEnd = () => {
    setDraggedCue(null);
    setDragOverColumn(null);
  };

  return (
    <div className="app-card">
      <div className="app-card-header">
        <i className="fas fa-tasks"></i> Training Cues
      </div>
      <div className="app-card-body">
        {cues.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No cues added yet. Start by adding one above!
          </p>
        ) : (
          <>
            <div className="mb-4 text-center instruction-text">
              <p className="text-sm text-gray-600 bg-gray-50 inline-block py-1 px-4 rounded-full shadow-sm">
                <i className="fas fa-arrows-alt mr-1"></i> Drag cards between columns to change status
              </p>
            </div>
            <div className="kanban-board">
              {/* Learning Column */}
              <div 
                className={`kanban-column ${dragOverColumn === "learning" ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, "learning")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "learning")}
              >
                <h3>Learning</h3>
                {cuesByStatus.learning.length === 0 ? (
                  <p className="text-gray-500 text-sm mt-2 text-center italic">No cues in this status</p>
                ) : (
                  <div className="flex-1 overflow-y-auto cue-cards-container">
                    {cuesByStatus.learning.map(cue => (
                      <div 
                        key={cue.id} 
                        className={`cue-card ${draggedCue === cue.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cue)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="pl-3 mb-2">
                          <h4 className="font-medium text-dog-dark">{cue.name}</h4>
                        </div>
                        <div className="last-practiced pl-3 mb-2">{formatDate(cue.lastPracticed)}</div>
                        <div className="cue-card-actions pl-3 flex gap-2">
                          <button
                            onClick={() => onPractice(cue.id)}
                            className="text-dog-blue p-1 rounded hover:bg-dog-blue/10 flex items-center justify-center"
                            aria-label={`Mark ${cue.name} as practiced`}
                            title="Mark as practiced"
                          >
                            <i className="fas fa-check-circle"></i>
                          </button>
                          <button
                            onClick={() => onDelete(cue.id)}
                            className="text-dog-red p-1 rounded hover:bg-dog-red/10 flex items-center justify-center"
                            aria-label={`Delete ${cue.name}`}
                            title="Delete cue"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Knows Column */}
              <div 
                className={`kanban-column ${dragOverColumn === "knows" ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, "knows")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "knows")}
              >
                <h3>Knows</h3>
                {cuesByStatus.knows.length === 0 ? (
                  <p className="text-gray-500 text-sm mt-2 text-center italic">No cues in this status</p>
                ) : (
                  <div className="flex-1 overflow-y-auto cue-cards-container">
                    {cuesByStatus.knows.map(cue => (
                      <div 
                        key={cue.id} 
                        className={`cue-card ${draggedCue === cue.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cue)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="pl-3 mb-2">
                          <h4 className="font-medium text-dog-dark">{cue.name}</h4>
                        </div>
                        <div className="last-practiced pl-3 mb-2">{formatDate(cue.lastPracticed)}</div>
                        <div className="cue-card-actions pl-3 flex gap-2">
                          <button
                            onClick={() => onPractice(cue.id)}
                            className="text-dog-blue p-1 rounded hover:bg-dog-blue/10 flex items-center justify-center"
                            aria-label={`Mark ${cue.name} as practiced`}
                            title="Mark as practiced"
                          >
                            <i className="fas fa-check-circle"></i>
                          </button>
                          <button
                            onClick={() => onDelete(cue.id)}
                            className="text-dog-red p-1 rounded hover:bg-dog-red/10 flex items-center justify-center"
                            aria-label={`Delete ${cue.name}`}
                            title="Delete cue"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Mastered Column */}
              <div 
                className={`kanban-column ${dragOverColumn === "mastered" ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, "mastered")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "mastered")}
              >
                <h3>Mastered</h3>
                {cuesByStatus.mastered.length === 0 ? (
                  <p className="text-gray-500 text-sm mt-2 text-center italic">No cues in this status</p>
                ) : (
                  <div className="flex-1 overflow-y-auto cue-cards-container">
                    {cuesByStatus.mastered.map(cue => (
                      <div 
                        key={cue.id} 
                        className={`cue-card ${draggedCue === cue.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cue)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="pl-3 mb-2">
                          <h4 className="font-medium text-dog-dark">{cue.name}</h4>
                        </div>
                        <div className="last-practiced pl-3 mb-2">{formatDate(cue.lastPracticed)}</div>
                        <div className="cue-card-actions pl-3 flex gap-2">
                          <button
                            onClick={() => onPractice(cue.id)}
                            className="text-dog-blue p-1 rounded hover:bg-dog-blue/10 flex items-center justify-center"
                            aria-label={`Mark ${cue.name} as practiced`}
                            title="Mark as practiced"
                          >
                            <i className="fas fa-check-circle"></i>
                          </button>
                          <button
                            onClick={() => onDelete(cue.id)}
                            className="text-dog-red p-1 rounded hover:bg-dog-red/10 flex items-center justify-center"
                            aria-label={`Delete ${cue.name}`}
                            title="Delete cue"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const RandomCuePicker: React.FC<{ 
  cues: Cue[]; 
  onPractice: (id: number) => void 
}> = ({ cues, onPractice }) => {
  const [randomCue, setRandomCue] = useState<Cue | null>(null);

  const pickRandomCue = useCallback(() => {
    if (cues.length === 0) return;
    const cue = cues[Math.floor(Math.random() * cues.length)];
    setRandomCue(cue);
    onPractice(cue.id); // Mark as practiced
    
    Notification.requestPermission().then(perm => {
      if (perm === "granted")
        new Notification(`Practice: ${cue.name}`, { icon: "/favicon.ico" });
    });
  }, [cues, onPractice]);

  return (
    <div className="app-card">
      <div className="app-card-header">
        <i className="fas fa-random"></i> Random Cue Picker
      </div>
      <div className="app-card-body">
        <button
          onClick={pickRandomCue}
          disabled={cues.length === 0}
          className="btn btn-primary w-full p-3 mb-4"
        >
          <i className="fas fa-dice"></i> Pick Random Cue
        </button>
        {randomCue ? (
          <div className="random-cue-result">
            <div className="random-cue-name">{randomCue.name}</div>
            <div className={`random-cue-status ${randomCue.status}`}>
              {randomCue.status.charAt(0).toUpperCase() + randomCue.status.slice(1)}
            </div>
            {randomCue.lastPracticed && (
              <p className="text-xs text-gray-500 mt-1">
                Last practiced: {new Date(randomCue.lastPracticed).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No cue selected</p>
        )}
      </div>
    </div>
  );
};

const Timer: React.FC = () => {
  const timers = [
    useTimer(0, 30),  // 30 seconds
    useTimer(1, 0),   // 1 minute
    useTimer(1, 30)   // 1 minute 30 seconds
  ];
  
  const handleClickerClick = () => {
    // Access the globally defined clicker sound
    if (window.clickerSound) {
      window.clickerSound();
    }
  };

  return (
    <div className="app-card">
      <div className="app-card-header">
        <i className="fas fa-clock"></i> Training Timer
      </div>
      <div className="app-card-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {timers.map((timer, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="timer-display">
                {timer.formattedTime}
              </div>
              <div className="timer-controls">
                {!timer.isActive ? (
                  <button
                    onClick={timer.start}
                    className="btn btn-primary"
                    title="Start timer"
                  >
                    <i className="fas fa-play"></i>
                  </button>
                ) : (
                  <button
                    onClick={timer.stop}
                    className="btn btn-secondary"
                    title="Stop timer"
                  >
                    <i className="fas fa-stop"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <button 
            onClick={handleClickerClick}
            className="clicker-button hidden md:flex"
            aria-label="Training Clicker"
          >
            <i className="fas fa-volume-high"></i>
            <span>Training Clicker</span>
          </button>
        </div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    clickerSound: () => void;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, null, loadStateFromStorage);

  const { dogs, cues, activeDogId } = state;

  // Filter cues for active dog
  const activeDogCues = cues.filter(cue => 
    activeDogId !== null && cue.dogId === activeDogId
  );

  return (
    <div className="min-h-screen py-6 px-4 md:px-8 app-container">
      <div className="max-w-6xl mx-auto">
        <Header 
          dogs={dogs}
          activeDogId={activeDogId}
          onSelectDog={(id) => dispatch({ type: "SET_ACTIVE_DOG", payload: { id } })}
          onAddDog={(name) => dispatch({ type: "ADD_DOG", payload: { name } })}
        />
        
        {activeDogId && (
          <>
            {/* Top Row - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Column 1 - Dog Management */}
              <DogManager
                dogs={dogs}
                activeDogId={activeDogId}
                onSelectDog={(id) => dispatch({ type: "SET_ACTIVE_DOG", payload: { id } })}
                onAddDog={(name) => dispatch({ type: "ADD_DOG", payload: { name } })}
              />
              
              {/* Column 2 - Add New Cue */}
              <CueForm
                onAdd={(name) => 
                  dispatch({ 
                    type: "ADD_CUE", 
                    payload: { name, dogId: activeDogId } 
                  })
                }
              />
              
              {/* Column 3 - Random Cue Picker */}
              <RandomCuePicker 
                cues={activeDogCues} 
                onPractice={(id) => 
                  dispatch({ type: "PRACTICE_CUE", payload: { id } })
                }
              />
            </div>
            
            {/* Bottom Row - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1 - Kanban Board */}
              <KanbanBoard
                cues={activeDogCues}
                onUpdateStatus={(id, status) =>
                  dispatch({ type: "UPDATE_CUE_STATUS", payload: { id, status } })
                }
                onDelete={(id) =>
                  dispatch({ type: "DELETE_CUE", payload: { id } })
                }
                onPractice={(id) => 
                  dispatch({ type: "PRACTICE_CUE", payload: { id } })
                }
              />
              
              {/* Column 2 - Timer */}
              <Timer />
            </div>
          </>
        )}

        {/* Mobile-only fixed clicker button */}
        {activeDogId && (
          <div className="md:hidden">
            <button 
              onClick={() => window.clickerSound && window.clickerSound()}
              className="clicker-button"
              aria-label="Clicker"
            >
              <i className="fas fa-volume-high"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
