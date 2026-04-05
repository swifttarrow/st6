import { mount, unmount, type HostContext } from '../index';
import './host-demo.css';

type PersonaKey = 'ic' | 'manager' | 'leadership';

interface PersonaCard {
  key: PersonaKey;
  label: string;
}

interface DemoHostContextResponse extends HostContext {
  persona: PersonaKey;
  label: string;
  summary: string;
  defaultRoute: string;
}

const PERSONAS: PersonaCard[] = [
  { key: 'ic', label: 'Alice (IC)' },
  { key: 'manager', label: 'Morgan (Manager)' },
  { key: 'leadership', label: 'Lee (Leadership)' },
];

const rootElement = document.getElementById('host-demo');
if (!rootElement) {
  throw new Error('Missing #host-demo element');
}
const root = rootElement;

function requiredElement<T extends Element>(selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required host demo element: ${selector}`);
  }
  return element;
}

root.innerHTML = `
  <main class="host-demo-shell">
    <div class="host-demo-layout">
      <aside class="host-demo-sidebar">
        <p class="host-demo-kicker">PA Host Shell Demo</p>
        <h1 class="host-demo-title">Mount the module the way a real host would.</h1>
        <p class="host-demo-copy">
          This page simulates the host app owning authentication, requesting a JWT-backed host context, and then
          mounting the Weekly Commitment Tracker via its exported <code>mount(container, context)</code> contract.
        </p>

        <section aria-labelledby="persona-title">
          <h2 id="persona-title" class="host-demo-section-title">Choose a host session</h2>
          <div class="host-demo-personas" data-personas></div>
        </section>

        <details class="host-demo-session-details" data-session-details open>
          <summary class="host-demo-session-summary">
            <span class="host-demo-session-summary-label">See more details</span>
            <span class="host-demo-session-chevron" aria-hidden="true"></span>
          </summary>
          <div class="host-demo-session-body">
            <p class="host-demo-status" data-status>
              Waiting for a host session. Start the backend with APP_DEMO_HOST_ENABLED=true and APP_AUTH_HMAC_SECRET,
              then select a persona above.
            </p>
            <p class="host-demo-meta" data-meta>
              The host fetches <code>/demo-host/context</code>, receives a JWT-backed context, and mounts the remote in a
              memory router so the host shell keeps control of the top-level URL.
            </p>
            <pre class="host-demo-json" data-context>{
  "hostContext": null
}</pre>
          </div>
        </details>
      </aside>

      <section class="host-demo-stage" aria-labelledby="stage-title">
        <div class="host-demo-stage-bar">
          <div>
            <h2 id="stage-title" class="host-demo-stage-title">Mounted Weekly Commitment Tracker</h2>
            <p class="host-demo-stage-subtitle" data-stage-subtitle>
              No remote is mounted yet. Select a host session to boot the module.
            </p>
          </div>
        </div>
        <div class="host-demo-stage-body">
          <div class="host-demo-module" data-module-root>
            <div class="host-demo-empty">
              <div class="host-demo-empty-card">
                <p class="host-demo-kicker">Host First</p>
                <h3 class="host-demo-title">The host owns identity.</h3>
                <p class="host-demo-copy">
                  The remote only receives a context object and a bearer token. That is the seam this assignment is
                  really asking you to demonstrate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
`;

const personasContainer = requiredElement<HTMLElement>('[data-personas]');
const sessionDetails = requiredElement<HTMLDetailsElement>('[data-session-details]');
const statusElement = requiredElement<HTMLElement>('[data-status]');
const metaElement = requiredElement<HTMLElement>('[data-meta]');
const contextElement = requiredElement<HTMLElement>('[data-context]');
const stageSubtitleElement = requiredElement<HTMLElement>('[data-stage-subtitle]');
const moduleRoot = requiredElement<HTMLElement>('[data-module-root]');

let currentPersona: PersonaKey = 'ic';
let mountedContext: DemoHostContextResponse | null = null;
let loading = false;

function renderPersonaButtons(): void {
  personasContainer.innerHTML = '';

  for (const persona of PERSONAS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `host-demo-persona${persona.key === currentPersona ? ' is-active' : ''}`;
    button.dataset.persona = persona.key;
    button.innerHTML = `<span class="host-demo-persona-label">${persona.label}</span>`;
    button.disabled = loading;
    button.addEventListener('click', () => {
      if (loading) return;
      if (mountedContext?.persona === persona.key && currentPersona === persona.key) return;
      currentPersona = persona.key;
      renderPersonaButtons();
      void loadPersona(persona.key);
    });
    personasContainer.appendChild(button);
  }
}

function setLoading(nextValue: boolean): void {
  loading = nextValue;
  renderPersonaButtons();
}

function renderUnmountedState(): void {
  unmount();
  stageSubtitleElement.textContent = 'No remote is mounted yet. Select a host session to boot the module.';
  moduleRoot.innerHTML = `
    <div class="host-demo-empty">
      <div class="host-demo-empty-card">
        <p class="host-demo-kicker">Host First</p>
        <h3 class="host-demo-title">The host owns identity.</h3>
        <p class="host-demo-copy">
          The remote only receives a context object and a bearer token. That is the seam this assignment is really
          asking you to demonstrate.
        </p>
      </div>
    </div>
  `;
}

function renderContextPreview(context: DemoHostContextResponse | null): void {
  if (!context) {
    contextElement.textContent = `{\n  "hostContext": null\n}`;
    return;
  }

  const accessTokenPreview =
    context.accessToken.length > 56
      ? `${context.accessToken.slice(0, 28)}...${context.accessToken.slice(-16)}`
      : context.accessToken;

  contextElement.textContent = JSON.stringify(
    {
      persona: context.persona,
      label: context.label,
      defaultRoute: context.defaultRoute,
      hostContext: {
        accessToken: accessTokenPreview,
        userId: context.userId,
        role: context.role,
        teamId: context.teamId,
        managerId: context.managerId,
        directReportIds: context.directReportIds,
      },
    },
    null,
    2,
  );
}

function setStatus(message: string, tone: 'default' | 'error' = 'default'): void {
  statusElement.textContent = message;
  statusElement.classList.toggle('is-error', tone === 'error');
  sessionDetails.classList.toggle('is-error', tone === 'error');
  if (tone === 'error') {
    sessionDetails.open = true;
  }
}

async function loadPersona(persona: PersonaKey): Promise<void> {
  setLoading(true);
  setStatus(`Requesting a host-owned JWT context for ${persona}...`);

  try {
    const response = await fetch(`/demo-host/context?persona=${persona}`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Host context request failed with ${response.status}`);
    }

    const context = (await response.json()) as DemoHostContextResponse;
    mountedContext = context;

    mount(
      moduleRoot,
      {
        accessToken: context.accessToken,
        userId: context.userId,
        role: context.role,
        teamId: context.teamId,
        managerId: context.managerId,
        directReportIds: context.directReportIds,
      },
      {
        router: {
          type: 'memory',
          initialEntries: [context.defaultRoute],
        },
      },
    );

    renderContextPreview(context);
    stageSubtitleElement.textContent = `Mounted as ${context.label} on ${context.defaultRoute}. Use the module navigation to explore without leaving the host shell.`;
    metaElement.textContent = `${context.summary} The host shell requested the token, chose the initial route, and passed the final context into mount(...).`;
    setStatus(`Mounted ${context.label}. The backend still validates the JWT before any /api request succeeds.`);
    sessionDetails.open = false;
  } catch (error) {
    renderUnmountedState();
    renderContextPreview(null);
    const message = error instanceof Error ? error.message : 'Unknown host demo error';
    setStatus(
      `Could not load the demo host context. Start the backend with APP_DEMO_HOST_ENABLED=true and APP_AUTH_HMAC_SECRET set, then retry. Details: ${message}`,
      'error',
    );
  } finally {
    setLoading(false);
  }
}

renderPersonaButtons();
renderUnmountedState();
renderContextPreview(null);
void loadPersona(currentPersona);
