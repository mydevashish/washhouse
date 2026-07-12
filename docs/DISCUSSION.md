# Laundry Marketplace Application — Complete Product Discussion & Planning

> **Historical document.** Canonical product reference: [`product/INDEX.md`](product/INDEX.md) and [`features/`](features/). See [`product/traceability.md`](product/traceability.md) for mapping.

# Project Vision

Build a modern laundry marketplace platform where users can:

- Discover nearby laundries
- Compare prices, ratings, and services
- Schedule pickup & delivery
- Track orders in real time
- Manage subscriptions

At the same time:

- Laundry owners can manage their operations
- Admins can monitor the complete ecosystem

The application should feel:
- Premium
- Modern
- Youth-focused
- Fast
- Simple
- Mobile-first

Target audience:
- College students
- Hostel students
- Young professionals
- Newly shifted employees
- Urban Gen Z users

---

# Product Positioning

Do NOT market this as:

"Laundry Management Software"

Instead market it as:

"Doorstep Laundry Marketplace"

Reason:
Marketplace businesses scale much faster through network effects.

---

# Phase 1 Goal

Build:
- Responsive web application
- Mobile-first UI/UX
- PWA-ready architecture

Avoid Android/iOS initially.

Reason:
- Lower development cost
- Faster launch
- Easier maintenance
- Faster iteration

---

# Recommended Tech Stack

# Frontend

## Framework
- Next.js (App Router)

## Styling
- Tailwind CSS

## UI Components
- shadcn/ui

## Animations
- Framer Motion

## 3D Effects
- React Three Fiber
- Drei

## State Management
- Zustand

## Forms
- React Hook Form + Zod

## API Calls
- Axios

## Data Fetching
- TanStack Query

## Icons
- Lucide React

---

# Backend

## Framework
- FastAPI

## ORM
- SQLAlchemy

## Validation
- Pydantic

## Authentication
- JWT + OTP Login

## Background Tasks
- Celery

## Caching
- Redis

## File Upload
- Cloudinary / S3

---

# Database

## Primary Database
- PostgreSQL

Recommended hosting:
- Neon

---

# Hosting Recommendation

# Frontend
- Vercel

# Backend
- Railway

# Database
- Neon

# Media Storage
- Cloudinary

# Email Service
- Resend

# Payments
- Razorpay

# Maps
- Google Maps API

---

# Recommended Architecture

```text
Users
   |
Next.js Frontend (Vercel)
   |
FastAPI Backend (Railway)
   |
PostgreSQL (Neon)
```

---

# Design Philosophy

# Important Rule

"Entertainment outside, efficiency inside."

Meaning:

## Landing Page
- Fancy
- 3D
- Motion rich
- Premium branding

## Main Application
- Fast
- Minimal
- Simple
- Highly usable

---

# UI/UX Strategy

# Landing Page

Use:
- Soft 3D
- Motion UI
- Floating elements
- Smooth transitions
- Glassmorphism
- Dark theme
- Animated hero section

Avoid:
- Heavy WebGL everywhere
- Over-animated pages
- Complex navigation

---

# Main App UI

Focus on:
- Speed
- Usability
- Simplicity

Reason:
Users want fast ordering.

---

# Customer Features

# Authentication
- OTP Login
- Google Login

---

# Homepage
- Nearby laundries
- Search
- Filters
- Offers
- Categories

---

# Laundry Listing
Show:
- Ratings
- Distance
- Pricing
- Delivery availability
- Estimated delivery time

---

# Laundry Details Page
- Images
- Reviews
- Service pricing
- Pickup availability
- Delivery slots
- Working hours

---

# Booking System
Services:
- Wash & Fold
- Dry Cleaning
- Ironing
- Shoe Cleaning
- Blanket Cleaning

Features:
- Pickup scheduling
- Delivery scheduling
- Notes/instructions

---

# Order Tracking
Statuses:
- Confirmed
- Pickup Assigned
- Picked Up
- Washing
- Ironing
- Ready
- Out for Delivery
- Delivered

---

# Reviews & Ratings
Users can:
- Rate laundries
- Add comments
- Upload images later

---

# Subscription Plans
Examples:
- Student Plan
- Bachelor Plan
- Family Plan
- Monthly Ironing

---

# Laundry Partner Panel

# Dashboard
- Daily orders
- Revenue
- Pending orders
- Completed orders

---

# Orders Management
- Accept/reject orders
- Update status
- Manage delivery

---

# Inventory Management
Track:
- Clothes count
- Missing items
- Damaged items

---

# QR / Barcode System
Every order should have:
- QR code
- Tracking ID

Purpose:
- Avoid cloth mixups

---

# Staff Management
Roles:
- Manager
- Delivery Boy
- Worker

---

# Analytics
- Revenue
- Repeat customers
- Service trends

---

# Admin Dashboard

# Features
- Laundry approval
- User management
- Commission settings
- Revenue analytics
- Complaint management
- Service area management

---

# Recommended Commission Model

Start with:
- 5% to 10% commission per order

---

# Suggested Database Tables

```text
users
roles
laundries
laundry_images
laundry_services
orders
order_items
payments
reviews
addresses
delivery_agents
subscriptions
inventory
notifications
complaints
transactions
```

---

# Backend Folder Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── laundries/
│   │   ├── orders/
│   │   ├── payments/
│   │   └── reviews/
│   │
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── utils/
│   ├── tasks/
│   └── main.py
│
├── alembic/
├── tests/
├── requirements.txt
└── Dockerfile
```

---

# Frontend Folder Structure

```text
frontend/
├── app/
├── components/
│   ├── ui/
│   ├── layouts/
│   ├── laundry/
│   ├── order/
│   └── shared/
│
├── services/
├── hooks/
├── store/
├── lib/
├── styles/
├── utils/
├── types/
└── public/
```

---

# Frontend Development Rules

# Use Mobile First Design

Important:
Most users will use mobile browsers.

---

# Use Reusable Components

Examples:
- Cards
- Buttons
- Modals
- Drawers
- Forms
- Tables

---

# Use Debounced Search
Recommended:
- 500ms debounce

---

# Use Backend Pagination
Recommended:
- 20 items per request

---

# Use Skeleton Loaders
Avoid:
- Blank screens

---

# Use Optimistic UI
For:
- Order status updates
- Reviews
- Wishlist/favorites

---

# Performance Rules

# Important

Website should load:
- Under 3 seconds

Avoid:
- Huge 3D models
- Heavy animations
- Unoptimized images

---

# Recommended Animation Strategy

# Use Framer Motion For:
- Page transitions
- Card hover effects
- Drawer animations
- Modal transitions
- Hero animations

---

# Use React Three Fiber ONLY For:
- Hero section
- Branding visuals
- Decorative floating objects

NOT:
- Entire application

---

# Security Recommendations

# Backend
- JWT authentication
- Role-based access
- Rate limiting
- Input validation
- SQL injection protection

---

# File Upload Validation
- File size limits
- Allowed MIME types

---

# Payment Security
Use:
- Razorpay official SDK

Never:
- Store card details

---

# Future Features

# Phase 2
- Inventory tracking
- QR system
- Analytics
- Subscriptions

---

# Phase 3
- AI recommendations
- Smart delivery routing
- Multi-city support
- Franchise support

---

# Business Strategy

# Initial Launch Strategy

Launch in:
- One city
- One area
- Near colleges/hostels

Reason:
- Dense users
- Recurring orders
- Easier marketing

---

# Operational Focus

Main competitive advantage:
- Reliable delivery
- Fast pickup
- Easy ordering
- Accurate inventory
- Excellent UX

NOT:
- Fancy infrastructure

---

# Recommended MVP Features

# Customer
- Authentication
- Laundry browsing
- Booking
- Order tracking
- Reviews

---

# Laundry
- Order management
- Status updates
- Basic analytics

---

# Admin
- Laundry approval
- Dashboard
- User management

---

# Hosting Cost Estimate

Initial MVP:
₹500–1500/month

---

# Recommended Development Timeline

# Month 1
- Authentication
- UI setup
- Laundry listing
- Admin panel

# Month 2
- Booking system
- Order tracking
- Payments

# Month 3
- Reviews
- Inventory basics
- Deployment
- Testing

---

# Cursor Development Strategy

# Recommended Workflow

1. Build backend APIs first
2. Create database models
3. Build reusable frontend components
4. Connect APIs
5. Add animations
6. Optimize performance
7. Deploy MVP

---

# Cursor Rules Recommendation

Use Cursor for:
- Boilerplate generation
- CRUD APIs
- UI components
- Type generation
- Validation schemas
- Folder structure generation

Avoid:
- Blindly accepting generated business logic

Always review:
- Security
- Database queries
- Performance
- API validation

---

# Final Product Goal

The application should feel like:

"A premium modern convenience platform"

NOT:
"A traditional laundry software"

The winning combination is:

- Minimal
- Fast
- Modern
- Motion-rich
- Youth-focused
- Operationally reliable