"use client";

import { Component } from "react";

// Guards against a bug in an admin-authored dynamic template throwing
// mid-render (e.g. reaching into a resume section that isn't shaped how the
// template code assumed) — without this, that throw would blank the whole
// print page / editor preview instead of just this one resume's view.
export default class TemplateErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Template render error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto w-[850px] rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          This template failed to render: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}
