# SQL Equivalents for Synkora Project

This directory contains SQL equivalents of all Prisma queries used in the Synkora application.

## 📁 Files Overview

| File | Description | Key Features |
|------|-------------|--------------|
| `01_schema.sql` | Complete database schema | Tables, enums, indexes, foreign keys |
| `02_user_authentication.sql` | User & auth queries | Registration, login, sessions, OAuth |
| `03_projects.sql` | Project management | CRUD operations, access control |
| `04_tasks_kanban.sql` | Task & Kanban queries | Task CRUD, positioning, statistics |
| `05_teams_invitations.sql` | Teams & invitations | Team management, invitation flow |
| `06_activities_markdown.sql` | Activities & markdown | Activity feed, markdown file operations |
| `07_dbms_concepts.sql` | Advanced DBMS concepts | Triggers, procedures, views, transactions |

## 🚀 Quick Start

1. **Review the schema**: Start with `01_schema.sql` to understand the database structure
2. **Find your query**: Use the documentation in `docs/SQL-EQUIVALENTS.md` to locate specific queries
3. **Understand the pattern**: Each file contains comments explaining the Prisma equivalent

## 📖 Documentation

For detailed documentation, see: [`../docs/SQL-EQUIVALENTS.md`](../docs/SQL-EQUIVALENTS.md)

## ⚠️ Important Notes

- These files are **for reference only**
- The actual database is managed by Prisma migrations
- Do not run these directly on production
- All queries use PostgreSQL syntax
- Parameter placeholders use `$1`, `$2`, etc. (PostgreSQL style)

## 🔍 Finding Queries

### By Feature
- **Authentication**: `02_user_authentication.sql`
- **Projects**: `03_projects.sql`
- **Tasks/Kanban**: `04_tasks_kanban.sql`
- **Teams**: `05_teams_invitations.sql`
- **Activities**: `06_activities_markdown.sql`

### By DBMS Concept
- **Triggers**: `07_dbms_concepts.sql` (lines 10-150)
- **Procedures**: `07_dbms_concepts.sql` (lines 160-300)
- **Views**: `07_dbms_concepts.sql` (lines 310-400)
- **Transactions**: `07_dbms_concepts.sql` (lines 410-480)

## 📝 Example Usage

### Finding a Prisma Query Equivalent

1. Locate the Prisma query in the codebase (e.g., `app/api/projects/route.ts`)
2. Check the corresponding SQL file (`03_projects.sql`)
3. Look for comments indicating the source file
4. Use the SQL query as a reference

### Understanding the Mapping

```typescript
// Prisma (TypeScript)
prisma.user.findUnique({ where: { email } })
```

```sql
-- SQL Equivalent
SELECT * FROM "User" WHERE email = $1;
```

## 🎯 Key Concepts Demonstrated

- ✅ **CRUD Operations**: Create, Read, Update, Delete
- ✅ **Joins**: INNER, LEFT, RIGHT joins for relations
- ✅ **Aggregations**: COUNT, SUM, AVG with GROUP BY
- ✅ **JSON Handling**: JSONB operations for JSON columns
- ✅ **Transactions**: Atomic operations
- ✅ **Triggers**: Automatic actions on data changes
- ✅ **Stored Procedures**: Encapsulated business logic
- ✅ **Views**: Simplified query interfaces

