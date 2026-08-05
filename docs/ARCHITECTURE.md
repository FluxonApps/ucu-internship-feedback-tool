# Architecture Overview

This document provides an overview of the project's architecture, directory organization, and architectural principles. It is intended to help contributors quickly understand the codebase, navigate its structure, and maintain consistency as the project evolves. 

High-Level System Diagram
                   ┌──────────────────────┐
                   │        Users         │
                   └──────────┬───────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │ Next.js Application    │
                  ├────────────────────────┤
                  │ Server Components      │
                  │ Client Components      │
                  └──────────┬─────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
 ┌──────────────────┐                 ┌───────────────────┐
 │ Firebase Admin   │                 │ Firebase Client   │
 │ (Server Layer)   │                 │ SDK (Client)      │
 └─────────┬────────┘                 └─────────┬─────────┘
           │                                    │
           └──────────────────┬─────────────────┘
                              ▼
                        Firebase Services

Core Components
Frontend
Name: Next.js Web Application

Description:

The frontend provides the primary user interface for students, teammates, and administrators. It consists of React Server Components for secure server-side rendering and Client Components for interactive functionality.

Technologies

Next.js
React
TypeScript

## UI Architecture
ToDo
- Strictly separate React Server Components (which should handle data fetching and security) from Client Components (which use "use client" for interactivity and browser APIs).
- Remove direct Firebase Client SDK calls, state mutations, and authorization logic from presentation files. Extract these into a dedicated data-access layer or specialized custom hooks so that UI components remain agnostic to the backend implementation.
-  Establish clear structural boundaries to prevent server-side operations (using the Firebase Admin SDK in src/server/) from bleeding into client-rendered code.


## UI

ToDo

## SERVER

ToDo


...
