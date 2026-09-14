import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../Auth/AuthGate';
import { useTeams } from '../Teams/TeamsProvider';
import './tutorial.css';

type TutorialContextValue = {
  isOpen: boolean;
  completed: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
};

type TutorialStep = {
  key: string;
  eyebrow: string;
  title: string;
  intro: string;
  items: { title: string; body: string }[];
  tip?: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

const CORE_QUIZ: QuizQuestion[] = [
  {
    id: 'start',
    question: 'Which Start Screen action creates a brand-new Tabula project?',
    options: ['Open project file', 'Start from scratch', 'Organization Settings', 'Preview'],
    correct: 1,
    explanation: 'Start from scratch creates a new project with its own project ID and project number.',
  },
  {
    id: 'preview',
    question: 'What is Preview used for?',
    options: ['Changing account permissions', 'Viewing the rendered project without editor controls', 'Deleting a project', 'Creating a license'],
    correct: 1,
    explanation: 'Preview switches from the editing workspace to the rendered project view. Use Edit to return.',
  },
  {
    id: 'save',
    question: 'What is the difference between autosave and Save in Tabula?',
    options: [
      'There is no difference',
      'Autosave keeps a browser-local working copy; Save creates a portable project file',
      'Autosave publishes the site; Save signs you out',
      'Autosave changes permissions; Save changes the template',
    ],
    correct: 1,
    explanation: 'Autosave protects the working session locally. Save creates the project file you can keep, move, or reopen later.',
  },
  {
    id: 'inspector',
    question: 'Where do you inspect and adjust design properties while editing?',
    options: ['The Inspector / right rail', 'The sign-in screen', 'The license table', 'The quiz panel'],
    correct: 0,
    explanation: 'The Inspector opens the right rail for inspecting and adjusting the selected design.',
  },
];

export function useTutorial() {
  const value = useContext(TutorialContext);
  if (!value) throw new Error('useTutorial must be used inside TutorialProvider');
  return value;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user, isPlatformAdmin } = useAuth();
  const { licenseType, isTeamsEdition } = useTeams();
  const editionKey = licenseType ?? 'core';
  const storageKey = `tabula:tutorial:${user.id}:${editionKey}:v1`;
  const [isOpen, setIsOpen] = useState(false);
  const [completed, setCompleted] = useState(() => localStorage.getItem(storageKey) === 'complete');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const steps = useMemo<TutorialStep[]>(() => {
    const items: TutorialStep[] = [
      {
        key: 'welcome',
        eyebrow: licenseType === 'teams' ? 'Teams Edition' : licenseType === 'individual' ? 'Individual Edition' : 'Getting started',
        title: 'Welcome to Tabula Design Now',
        intro: 'Tabula is a visual design and code workspace for opening an existing project, starting something new, editing visually, working in code, and previewing the result in one place.',
        items: [
          { title: 'Sign in and enter your workspace', body: 'After signing in, Tabula loads the workspace connected to your account and license.' },
          { title: 'Start simple', body: 'Use the Start Screen to open a known project, create a blank project, or reopen a saved Tabula file.' },
          { title: 'Work visually or in code', body: 'The canvas, Inspector, and Code Drawer work together so you can choose the level of control you need.' },
          { title: 'Keep control of your files', body: 'Autosave protects your local working state, while Save creates a portable Tabula project file.' },
        ],
        tip: 'You can reopen this tutorial at any time from the Tutorial button in the header or Start Screen.',
      },
      {
        key: 'start-screen',
        eyebrow: 'Step 1',
        title: 'Choose how you want to begin',
        intro: 'The Start Screen is your launch point. Choose the path that matches the work you already have.',
        items: [
          { title: 'Open Momentum Data Solutions', body: 'Loads the built-in Momentum Data Solutions project so you can edit the real site without importing a file first.' },
          { title: 'Start from scratch', body: 'Creates a clean project and assigns a new project ID and project number.' },
          { title: 'Open project file', body: 'Loads a saved .tabula or supported project JSON file. You can also drag a project file onto the Start Screen.' },
          { title: 'Continue recent project', body: 'Returns to the latest project stored in the current browser when one is available.' },
        ],
      },
      {
        key: 'workspace',
        eyebrow: 'Step 2',
        title: 'Know the workspace',
        intro: 'Once a project is open, Tabula separates navigation, design, properties, and code so you can move quickly without losing context.',
        items: [
          { title: 'Header', body: 'Shows the project identity, Undo/Redo, account tools, autosave state, Save/Open, Inspector, Preview, and Tutorial access.' },
          { title: 'Left rail', body: 'Use the left side for project structure and the tools that help you choose what you are working on.' },
          { title: 'Canvas', body: 'This is the visual working area where the current project is displayed and edited.' },
          { title: 'Inspector / right rail', body: 'Open Inspector to review and adjust the selected design and theme properties.' },
          { title: 'Code Drawer', body: 'Use the code area when you want direct control over the project source. It can sit below or beside the workspace.' },
        ],
        tip: 'A strong Tabula workflow is: select → inspect → adjust → preview → save.',
      },
      {
        key: 'editing',
        eyebrow: 'Step 3',
        title: 'Edit, preview, and protect your work',
        intro: 'Tabula gives you several safety nets while you make changes.',
        items: [
          { title: 'Undo and Redo', body: 'Use these for normal editing reversals while you work.' },
          { title: 'Autosave', body: 'The header shows whether the browser-local working copy is ready, saving, saved, or needs a retry.' },
          { title: 'Preview', body: 'Preview removes the editing workspace so you can inspect the rendered result. Choose Edit to return.' },
          { title: 'Save', body: 'Save creates a portable project file. Use it for handoff, backup, or reopening the project somewhere else.' },
        ],
        tip: 'Autosave is convenient, but a downloaded project file is still the clearest portable backup.',
      },
    ];

    if (licenseType === 'individual') {
      items.push({
        key: 'individual',
        eyebrow: 'Individual Edition',
        title: 'Your single-user Tabula workspace',
        intro: 'Individual Edition keeps the experience focused on one licensed user and the core design/development workflow.',
        items: [
          { title: 'One licensed seat', body: 'Individual Edition is configured for a single licensed user rather than a multi-role organization.' },
          { title: 'Full project workflow', body: 'You can create, open, edit, inspect, work in code, preview, autosave, and save portable Tabula projects.' },
          { title: 'No team administration clutter', body: 'Organization Builder, team role appointments, and User Access Change workflows are Teams Edition features and stay out of the standard Individual experience.' },
          { title: 'Your projects stay central', body: 'The Start Screen and editor remain the primary places to work, so the interface stays focused on building rather than managing a team.' },
        ],
        tip: 'If collaboration and role-based administration become necessary, Teams Edition adds those controls without changing the core editor workflow.',
      });
    }

    if (isTeamsEdition) {
      items.push({
        key: 'teams',
        eyebrow: 'Teams Edition',
        title: 'Organization and team controls',
        intro: 'Teams Edition adds organization setup, role management, and access workflows without changing the core design workspace.',
        items: [
          { title: 'Organization Builder', body: 'Org Admin configures the organization, recommended template, environments, technologies, and role appointments.' },
          { title: 'Organization Settings', body: 'Use Settings for ongoing access permissions, user setup, and user access change requests.' },
          { title: 'Role-aware access', body: 'Org Admin, Site Admin, Section Leader, Site Designer, and Logo Designer each receive the permissions intended for their role.' },
        ],
        tip: 'The Organization Builder is setup-oriented; Organization Settings is for day-to-day administration.',
      });
    }

    if (isPlatformAdmin) {
      items.push({
        key: 'developer',
        eyebrow: 'Developer Access',
        title: 'Your developer view',
        intro: 'Developer Access is a platform-level support and administration layer. It is separate from the normal customer role hierarchy.',
        items: [
          { title: 'Developer badge', body: 'The header identifies when your platform-admin Developer Access is active.' },
          { title: 'Administrative visibility', body: 'Developer Access can inspect projects, invites, Teams setup, team assignments, access requests, and licensing surfaces.' },
          { title: 'Role override for support', body: 'Developer Access can open Organization and Settings even when a standard organization role would normally be more restricted.' },
        ],
        tip: 'Developer Access does not expose secret credentials or service-role keys through the Tabula interface.',
      });
    }

    return items;
  }, [licenseType, isTeamsEdition, isPlatformAdmin]);

  const quiz = useMemo<QuizQuestion[]>(() => {
    const editionQuestion: QuizQuestion = licenseType === 'teams'
      ? {
          id: 'edition',
          question: 'In Teams Edition, which standard organization role can open and run the Organization Builder?',
          options: ['Site Designer', 'Section Leader', 'Org Admin', 'Logo Designer'],
          correct: 2,
          explanation: 'Org Admin is the standard role responsible for the Organization Builder. Platform Developer Access can override this for support and administration.',
        }
      : licenseType === 'individual'
        ? {
            id: 'edition',
            question: 'Which statement best describes Individual Edition?',
            options: [
              'It is a single-user license focused on the core Tabula project workflow',
              'It requires a Site Admin and Section Leader before a project can open',
              'It only supports Preview and does not include editing tools',
              'It is the same as Teams Edition with all organization controls enabled',
            ],
            correct: 0,
            explanation: 'Individual Edition uses one licensed seat and keeps the focus on the core project editing workflow rather than Teams organization administration.',
          }
        : {
            id: 'edition',
            question: 'Which Tabula area gives direct access to project source code?',
            options: ['Code Drawer', 'Preview', 'License Admin', 'Sign-in screen'],
            correct: 0,
            explanation: 'The Code Drawer is the source-editing area and can be positioned below or beside the workspace.',
          };

    return [...CORE_QUIZ, editionQuestion];
  }, [licenseType]);

  const quizStep = steps.length;
  const totalSteps = steps.length + 1;
  const onQuiz = step === quizStep;
  const allAnswered = quiz.every((question) => answers[question.id] !== undefined);
  const score = submitted
    ? quiz.reduce((total, question) => total + (answers[question.id] === question.correct ? 1 : 0), 0)
    : 0;
  const passed = submitted && score >= 4;

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const finish = () => {
    if (!passed) return;
    localStorage.setItem(storageKey, 'complete');
    setCompleted(true);
    setIsOpen(false);
    setStep(0);
    resetQuiz();
  };

  const openTutorial = () => {
    setStep(0);
    resetQuiz();
    setIsOpen(true);
  };

  const value = useMemo<TutorialContextValue>(() => ({
    isOpen,
    completed,
    openTutorial,
    closeTutorial: () => setIsOpen(false),
  }), [isOpen, completed]);

  const editionLabel = licenseType === 'teams' ? 'Teams Edition' : licenseType === 'individual' ? 'Individual Edition' : 'Tabula';

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {isOpen ? (
        <div className="tutorial-backdrop" role="presentation">
          <section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
            <header className="tutorial-header">
              <div>
                <span className="tutorial-kicker">Tabula Design Now · {editionLabel} Tutorial</span>
                <h2 id="tutorial-title">Getting started with Tabula</h2>
                <p>{onQuiz ? 'Finish with a short knowledge check.' : `Part ${step + 1} of ${totalSteps}`}</p>
              </div>
              <button type="button" className="tutorial-close" onClick={() => setIsOpen(false)} aria-label="Close tutorial">Close</button>
            </header>

            <div className="tutorial-progress" aria-label="Tutorial progress">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === step ? 'active' : index < step ? 'complete' : ''}
                  onClick={() => { setStep(index); if (index !== quizStep) setSubmitted(false); }}
                  aria-label={`Go to tutorial part ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {!onQuiz ? (
              <div className="tutorial-body">
                <div className="tutorial-step-heading">
                  <span>{steps[step].eyebrow}</span>
                  <h3>{steps[step].title}</h3>
                  <p>{steps[step].intro}</p>
                </div>
                <div className="tutorial-grid">
                  {steps[step].items.map((item) => (
                    <article key={item.title} className="tutorial-item">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
                {steps[step].tip ? <aside className="tutorial-tip"><strong>Useful tip</strong><span>{steps[step].tip}</span></aside> : null}
              </div>
            ) : (
              <div className="tutorial-body tutorial-quiz">
                <div className="tutorial-step-heading">
                  <span>Knowledge check</span>
                  <h3>Quick {editionLabel} quiz</h3>
                  <p>Answer all five questions. A score of 4 out of 5 completes the tutorial.</p>
                </div>
                <div className="tutorial-question-list">
                  {quiz.map((question, questionIndex) => (
                    <fieldset className="tutorial-question" key={question.id}>
                      <legend>{questionIndex + 1}. {question.question}</legend>
                      <div className="tutorial-options">
                        {question.options.map((option, optionIndex) => {
                          const selected = answers[question.id] === optionIndex;
                          const correct = submitted && optionIndex === question.correct;
                          const wrongSelected = submitted && selected && optionIndex !== question.correct;
                          return (
                            <label key={option} className={correct ? 'correct' : wrongSelected ? 'incorrect' : selected ? 'selected' : ''}>
                              <input
                                type="radio"
                                name={`tutorial-${question.id}`}
                                checked={selected}
                                disabled={submitted}
                                onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                      {submitted ? <p className="tutorial-explanation">{question.explanation}</p> : null}
                    </fieldset>
                  ))}
                </div>

                {submitted ? (
                  <div className={`tutorial-score ${passed ? 'passed' : 'retry'}`} role="status" aria-live="polite">
                    <strong>{score}/5</strong>
                    <span>{passed ? 'Tutorial complete — you are ready to work in Tabula.' : 'Review the explanations and try the quiz again.'}</span>
                  </div>
                ) : null}
              </div>
            )}

            <footer className="tutorial-footer">
              <div className="tutorial-footer-status">
                {completed ? <span>Previously completed</span> : <span>{Math.round(((step + 1) / totalSteps) * 100)}% through tutorial</span>}
              </div>
              <div className="tutorial-actions">
                {step > 0 ? <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button> : null}
                {!onQuiz ? (
                  <button type="button" className="primary" onClick={() => setStep((current) => Math.min(quizStep, current + 1))}>
                    {step === quizStep - 1 ? 'Take the quiz' : 'Continue'}
                  </button>
                ) : !submitted ? (
                  <button type="button" className="primary" disabled={!allAnswered} onClick={() => setSubmitted(true)}>Check answers</button>
                ) : passed ? (
                  <button type="button" className="primary" onClick={finish}>Finish tutorial</button>
                ) : (
                  <button type="button" className="primary" onClick={resetQuiz}>Try quiz again</button>
                )}
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </TutorialContext.Provider>
  );
}
