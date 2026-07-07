import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";

const statePath = () => join(config.dataDir, "state.json");

const defaultState = () => ({
  sites: [],
  checks: [],
  alerts: [],
  subscription: { status: "free", plan: "self-hosted" },
  stripeEvents: []
});

export const readState = () => {
  if (!existsSync(config.dataDir)) {
    mkdirSync(config.dataDir, { recursive: true });
  }
  if (!existsSync(statePath())) {
    writeFileSync(statePath(), JSON.stringify(defaultState(), null, 2));
  }
  return JSON.parse(readFileSync(statePath(), "utf8"));
};

export const writeState = (state) => {
  if (!existsSync(config.dataDir)) {
    mkdirSync(config.dataDir, { recursive: true });
  }
  writeFileSync(statePath(), JSON.stringify(state, null, 2));
};

export const addSite = (site) => {
  const state = readState();
  state.sites.push(site);
  writeState(state);
  return site;
};

export const removeSite = (siteId) => {
  const state = readState();
  state.sites = state.sites.filter((s) => s.id !== siteId);
  state.checks = state.checks.filter((c) => c.siteId !== siteId);
  writeState(state);
};

export const updateSite = (siteId, patch) => {
  const state = readState();
  const idx = state.sites.findIndex((s) => s.id === siteId);
  if (idx === -1) return null;
  state.sites[idx] = { ...state.sites[idx], ...patch };
  writeState(state);
  return state.sites[idx];
};

export const recordCheck = (check) => {
  const state = readState();
  state.checks.unshift(check);
  state.checks = state.checks.slice(0, 5000);
  writeState(state);
};

export const recordAlert = (alert) => {
  const state = readState();
  state.alerts.unshift(alert);
  state.alerts = state.alerts.slice(0, 500);
  writeState(state);
};

export const getLatestCheck = (siteId) => {
  const state = readState();
  return state.checks.find((c) => c.siteId === siteId) || null;
};

export const getSite = (siteId) => {
  const state = readState();
  return state.sites.find((s) => s.id === siteId) || null;
};

export const isManagedActive = () => {
  const state = readState();
  return state.subscription?.status === "active";
};

export const getSiteLimit = () => {
  return isManagedActive() ? 9999 : config.freeSiteLimit;
};

export const upsertSubscription = (patch) => {
  const state = readState();
  state.subscription = { ...state.subscription, ...patch };
  writeState(state);
  return state.subscription;
};

export const hasProcessedStripeEvent = (eventId) => {
  const state = readState();
  return (state.stripeEvents || []).includes(eventId);
};

export const markStripeEventProcessed = (eventId) => {
  const state = readState();
  if (!state.stripeEvents) state.stripeEvents = [];
  state.stripeEvents.unshift(eventId);
  state.stripeEvents = state.stripeEvents.slice(0, 200);
  writeState(state);
};
