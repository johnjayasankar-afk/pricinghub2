import { Component, type ErrorInfo, type ReactNode } from "react";
import { catalogHref } from "../state/catalog-ui";
import { listingHref } from "../state/listing-href";

type Props = { children: ReactNode };
type State = { err: Error | null };

function go(href: string) {
  window.location.hash = href.replace(/^#/, "");
  window.location.reload();
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(err, info.componentStack);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="app">
        <div className="legal">
          <h1>This copy hit an error</h1>
          <p>
            Your listing and catalog are still in this browser. Open the calculator or
            catalog, or reload this page. Nothing was uploaded.
          </p>
          {this.state.err.message ? <p className="note">{this.state.err.message}</p> : null}
          <div className="actions">
            <button className="btn" type="button" onClick={() => go(listingHref())}>
              Open calculator
            </button>
            <button className="btn secondary" type="button" onClick={() => go(catalogHref())}>
              Open catalog
            </button>
            <button className="btn secondary" type="button" onClick={() => window.location.reload()}>
              Reload this page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
