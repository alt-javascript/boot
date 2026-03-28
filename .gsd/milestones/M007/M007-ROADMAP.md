# M007: M007: Frontend Integration — Browser-First CDI for SPAs

## Vision
Developers use the same CDI, config, and service-layer patterns in the browser that they use on the server. Framework-agnostic services wire into Vue, React, Angular, or any other frontend framework with minimal ceremony. URL-based profiles drive config just like `NODE_ACTIVE_PROFILES` does on the server, enabling per-environment configuration in SPAs without a build step.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | URL-Based Browser Profiles | high | — | ✅ | TBD |
| S02 | Vue CDN Integration | medium | S01 | ✅ | TBD |
| S03 | CDN-First Framework Coverage | medium | S02 | ✅ | TBD |
| S04 | React Integration | high | S01 | ✅ | TBD |
| S05 | Vue CLI + Angular Integration | medium | S04 | ✅ | TBD |
