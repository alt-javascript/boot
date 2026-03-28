# M003: M003: P2 Features + Config Refactoring

## Vision
Make the @alt-javascript framework robust and developer-friendly with circular dependency detection, initialization ordering, primary beans, better error messages, formal lifecycle, and a cleaner config package — all before shipping v3.0.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Circular Dependency Detection + Initialization Ordering | high | — | ✅ | circular singleton dependencies produce a clear error naming the cycle; `dependsOn` controls singleton initialization order |
| S02 | Primary Beans + Lifecycle + Error Messages | medium | S01 | ✅ | `primary: true` resolves ambiguity; singletons with `start()`/`stop()` participate in formal lifecycle; startup errors include bean name and phase |
| S03 | Config Package Refactoring | medium | — | ✅ | config package internals are cleaner — reduced class count, consistent patterns, no behavior changes; all 44 config tests pass |
