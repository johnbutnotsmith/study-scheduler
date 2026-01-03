// src/components/SubjectList.tsx

export interface TopicInput {
  id?: string;
  name: string;
  priority: number;
  familiarity: number;
}

export interface SubjectInput {
  id?: string;
  name: string;
  difficulty: number;
  confidence: number;
  topics: TopicInput[];
}

interface SubjectListProps {
  subjects: SubjectInput[];
  loading?: boolean;
  onAddSubject: () => void;
  onUpdateSubject: (index: number, subject: SubjectInput) => void;
  onRemoveSubject: (index: number) => void;
  onAddTopic: (subjectIndex: number) => void;
  onRemoveTopic: (subjectIndex: number, topicIndex: number) => void;
}

export default function SubjectList({
  subjects,
  loading,
  onAddSubject,
  onUpdateSubject,
  onRemoveSubject,
  onAddTopic,
  onRemoveTopic,
}: SubjectListProps) {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Subjects</h3>
          <p className="text-xs text-slate-500">
            Add the subjects you want to study and their topics.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddSubject}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5
                     text-sm font-semibold shadow-sm transition-all
                     bg-emerald-600 text-white hover:bg-emerald-500
                     disabled:bg-emerald-300 disabled:cursor-not-allowed"
        >
          + Add subject
        </button>
      </div>

      {subjects.length === 0 && (
        <p className="text-xs text-slate-500 italic">
          No subjects yet. Start by adding one.
        </p>
      )}

      {/* Subject list */}
      <div className="space-y-3">
        {subjects.map((subject, sIdx) => (
          <div
            key={subject.id ?? sIdx}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 space-y-3"
          >
            {/* Subject header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-medium text-slate-800">
                  Subject name
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                  value={subject.name}
                  onChange={(e) =>
                    onUpdateSubject(sIdx, {
                      ...subject,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              {/* Difficulty & Confidence */}
              <div className="flex items-center justify-between gap-3 sm:w-64">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Difficulty
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    value={subject.difficulty}
                    onChange={(e) =>
                      onUpdateSubject(sIdx, {
                        ...subject,
                        difficulty: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Confidence
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    value={subject.confidence}
                    onChange={(e) =>
                      onUpdateSubject(sIdx, {
                        ...subject,
                        confidence: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveSubject(sIdx)}
                  className="text-[11px] font-medium text-slate-500 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-800">
                  Topics
                </span>
                <button
                  type="button"
                  onClick={() => onAddTopic(sIdx)}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500"
                >
                  + Add topic
                </button>
              </div>

              {/* Header row for topic fields */}
              {subject.topics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2 text-[11px] font-medium text-slate-700">
                  <span>Topic name</span>
                  <span>Priority</span>
                  <span>Familiarity</span>
                  <span></span>
                </div>
              )}

              {/* Topic list */}
              <div className="space-y-2">
                {subject.topics.map((topic, tIdx) => (
                  <div
                    key={topic.id ?? tIdx}
                    className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center"
                  >
                    <input
                      type="text"
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      placeholder="Topic name"
                      value={topic.name}
                      onChange={(e) =>
                        onUpdateSubject(sIdx, {
                          ...subject,
                          topics: subject.topics.map((t, i) =>
                            i === tIdx ? { ...t, name: e.target.value } : t
                          ),
                        })
                      }
                    />

                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      value={topic.priority}
                      onChange={(e) =>
                        onUpdateSubject(sIdx, {
                          ...subject,
                          topics: subject.topics.map((t, i) =>
                            i === tIdx
                              ? { ...t, priority: Number(e.target.value) || 1 }
                              : t
                          ),
                        })
                      }
                    />

                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      value={topic.familiarity}
                      onChange={(e) =>
                        onUpdateSubject(sIdx, {
                          ...subject,
                          topics: subject.topics.map((t, i) =>
                            i === tIdx
                              ? {
                                  ...t,
                                  familiarity: Number(e.target.value) || 1,
                                }
                              : t
                          ),
                        })
                      }
                    />

                    <button
                      type="button"
                      onClick={() => onRemoveTopic(sIdx, tIdx)}
                      className="text-[11px] font-medium text-slate-500 hover:text-red-500 transition-colors text-right"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
