# Sadeem Backend — AI Coding Rules

## 1. Project Philosophy

Sadeem is an MVP. Prioritize working features, correctness, readability, and maintainability over architectural complexity.

**Always choose the simplest solution that correctly satisfies the current requirements.**

Do not build enterprise-level infrastructure for problems that do not exist yet.

## 2. Before Writing Code

- Inspect the existing implementation and related files before making changes.
- Follow the existing project structure, naming conventions, error-handling patterns, and coding style.
- Reuse existing utilities, middleware, services, and validation logic when appropriate.
- Identify the actual problem before proposing a solution.
- Prefer targeted changes over rewriting entire modules.
- Do not introduce a new library or dependency when the existing stack can solve the problem.
- If a requirement is unclear and materially affects the implementation, ask before making assumptions.

## 3. Avoid Overengineering

Do not introduce the following unless a current, concrete requirement justifies them:

- Unnecessary abstraction layers or design patterns.
- Generic frameworks or configurable systems for one simple use case.
- Excessive service, factory, helper, or utility files.
- Duplicate validation, error handling, or business logic.
- Unnecessary queues, background workers, retry systems, or concurrency management.
- Complex dependency injection or plugin architectures.
- Premature optimization or speculative scalability features.
- Excessive defensive checks for impossible states.
- Unnecessary comments that merely restate the code.

A function does not need a separate file simply because it can be extracted. Extract functions when doing so improves reuse, clarity, or separation of responsibilities.

Do not remove useful validation, security checks, or error handling merely to reduce line count.

## 4. Architecture and Code Organization

Follow the existing project structure.

- **Routes:** Define endpoints and middleware order.
- **Controllers:** Handle HTTP requests and responses.
- **Services:** Contain reusable business logic when it is needed by multiple operations or when separation improves clarity.
- **Models:** Define Mongoose schemas and database structure.
- **Schemas:** Keep request validation and validation rules here, following the existing validation library and conventions.
- **Middleware:** Handle authentication, authorization, request processing, and other cross-cutting concerns.
- **Utils:** Keep genuinely reusable, framework-independent helpers here.
- **Config:** Centralize environment-dependent configuration and application constants.

Do not move code between layers just to follow a theoretical architecture. Follow established patterns unless there is a clear reason to change them.

## 5. Validation and Security

- Keep request validation in the existing `schemas` directory, not in Mongoose model files.
- Validate incoming data at the appropriate application boundary.
- Never trust client-provided IDs, roles, prices, balances, file metadata, or permissions.
- Follow existing authentication and authorization middleware.
- Never expose secrets, stack traces, or internal implementation details in production responses.
- Preserve existing security protections unless a verified issue requires a change.

## 6. Database and Business Logic

- Use the existing Mongoose models and relationships.
- Keep business rules explicit and easy to follow.
- Use database transactions when required to maintain consistency across related database operations, especially financial operations.
- Avoid transactions, abstractions, or additional database operations when they do not provide a concrete benefit.
- Never silently change existing business rules, database fields, API response formats, or route contracts.
- Handle cleanup of external resources when a failed operation could leave inconsistent state.

## 7. Error Handling

- Follow the existing error-handling middleware and `httpError` conventions.
- Avoid redundant try/catch blocks that only rethrow errors without adding useful handling.
- Preserve useful internal error information for debugging.
- Return consistent and safe API errors to clients.
- Do not convert every error into the same generic response when the application needs to distinguish validation, authorization, and server errors.

## 8. Implementation Workflow

For each task:

1. Inspect the relevant existing code.
2. Identify the root problem and the smallest reasonable implementation.
3. Briefly explain the planned changes when the task is non-trivial.
4. Implement only what the requirements need.
5. Reuse existing patterns and avoid unrelated refactoring.
6. Run relevant tests, linting, or other available checks.
7. Review the final changes for duplicate code, unnecessary abstractions, regressions, and missing error handling.

Do not stop after producing a plan when the task clearly requests implementation.

## 9. Definition of Done

A feature is complete when:

- It satisfies the stated requirements.
- It integrates with the existing codebase.
- Validation and authorization are handled correctly.
- Relevant error cases are addressed.
- Existing functionality is preserved.
- Relevant tests or checks pass, or any verification limitations are clearly reported.
- The implementation is no more complex than necessary.

## 10. Final Response

After completing a task, briefly report:

- What was implemented.
- The files changed.
- The tests or checks performed and their results.
- Any unresolved problems or required configuration.
- Any important trade-offs.

Do not claim that something works unless it has been verified.

**Final rule: Prefer boring, straightforward, production-conscious code over clever or unnecessarily sophisticated solutions.**