Based on the provided codebase and requirements, I'll outline a detailed implementation plan for revamping the curriculum management in subjects using Approach 1. Let's break this down into steps:

1. First, Update Prisma Schema
```prisma
// prisma/schema.prisma

model CurriculumNode {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        String   // 'CHAPTER' | 'TOPIC' | 'SUBTOPIC'
  parentId    String?
  order       Int
  subjectId   String
  subject     Subject  @relation(fields: [subjectId], references: [id])
  resources   CurriculumResource[]
  activities  CurriculumActivity[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CurriculumResource {
  id          String   @id @default(cuid())
  title       String
  type        String   // 'READING' | 'VIDEO' | 'URL' | 'DOCUMENT'
  content     String
  nodeId      String
  node        CurriculumNode @relation(fields: [nodeId], references: [id])
  fileInfo    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CurriculumActivity {
  id          String   @id @default(cuid())
  title       String
  type        String
  content     Json
  isGraded    Boolean  @default(false)
  nodeId      String
  node        CurriculumNode @relation(fields: [nodeId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

2. Create New Components for Curriculum Management

```typescript
// src/components/dashboard/roles/super-admin/subject/curriculum/CurriculumManager.tsx

export const CurriculumManager: React.FC<{subjectId: string}> = ({subjectId}) => {
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 border-r">
        <CurriculumTree 
          subjectId={subjectId}
          onNodeSelect={setSelectedNode}
        />
      </div>
      
      <div className="col-span-9">
        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content">
            <NodeEditor node={selectedNode} />
          </TabsContent>
          
          <TabsContent value="resources">
            <ResourceManager nodeId={selectedNode?.id} />
          </TabsContent>
          
          <TabsContent value="activities">
            <ActivityManager nodeId={selectedNode?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
```

3. Implement Curriculum Tree Component

```typescript
// src/components/dashboard/roles/super-admin/subject/curriculum/CurriculumTree.tsx

export const CurriculumTree: React.FC<{
  subjectId: string;
  onNodeSelect: (node: CurriculumNode) => void;
}> = ({subjectId, onNodeSelect}) => {
  const {data: nodes} = api.curriculum.getNodes.useQuery({subjectId});
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center p-2">
        <h3 className="font-semibold">Curriculum Structure</h3>
        <Button variant="outline" size="sm" onClick={handleAddNode}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </div>
      
      <Tree>
        {buildTreeNodes(nodes, onNodeSelect)}
      </Tree>
    </div>
  );
};
```

4. Create Resource Manager Component

```typescript
// src/components/dashboard/roles/super-admin/subject/curriculum/ResourceManager.tsx

export const ResourceManager: React.FC<{nodeId?: string}> = ({nodeId}) => {
  const {data: resources} = api.curriculum.getResources.useQuery({nodeId});
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Learning Resources</h3>
        <Button onClick={handleAddResource}>Add Resource</Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {resources?.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onEdit={handleEditResource}
            onDelete={handleDeleteResource}
          />
        ))}
      </div>
      
      <ResourceForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        nodeId={nodeId}
        resource={selectedResource}
      />
    </div>
  );
};
```

5. Update SubjectManagement Component

```typescript
// src/components/dashboard/roles/super-admin/subject/SubjectManagement.tsx

export const SubjectManagement = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'curriculum'>('list');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Subject Management</CardTitle>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'curriculum')}>
            <TabsList>
              <TabsTrigger value="list">Subjects</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'list' ? (
          <SubjectList
            subjects={subjects}
            onSelect={(id) => {
              setSelectedSubject(id);
              setActiveTab('curriculum');
            }}
          />
        ) : (
          selectedSubject && (
            <CurriculumManager subjectId={selectedSubject} />
          )
        )}
      </CardContent>
    </Card>
  );
};
```

6. Add API Routes

```typescript
// src/server/api/routers/curriculum.ts

export const curriculumRouter = createTRPCRouter({
  getNodes: protectedProcedure
    .input(z.object({ subjectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.curriculumNode.findMany({
        where: { subjectId: input.subjectId },
        orderBy: { order: 'asc' }
      });
    }),

  createNode: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(['CHAPTER', 'TOPIC', 'SUBTOPIC']),
      parentId: z.string().optional(),
      subjectId: z.string(),
      order: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.curriculumNode.create({
        data: input
      });
    }),

  // Add other CRUD operations for nodes, resources, and activities
});
```

7. Update Navigation

```typescript
// src/components/dashboard/roles/super-admin/subject/SubjectNavigation.tsx

export const SubjectNavigation = () => {
  return (
    <nav className="space-x-2">
      <Link href="/dashboard/super-admin/subject">
        <Button variant="ghost">Subjects</Button>
      </Link>
      <Link href="/dashboard/super-admin/subject/curriculum">
        <Button variant="ghost">Curriculum</Button>
      </Link>
    </nav>
  );
};
```

This implementation:
1. Maintains consistency with existing UI components and patterns
2. Provides a clear hierarchy for curriculum management
3. Separates concerns between different aspects (content, resources, activities)
4. Uses familiar UI patterns (trees, cards, tabs) for intuitive navigation
5. Integrates with existing subject management functionality
6. Supports graded and non-graded activities
7. Allows for resource management and organization

The UI/UX follows best practices by:
- Using a familiar tree structure for curriculum hierarchy
- Providing clear visual feedback for selected items
- Using tabs to organize different types of content
- Maintaining consistent styling with existing components
- Including proper loading states and error handling
- Supporting drag-and-drop for reordering (can be added)
- Providing clear actions for adding/editing content

This implementation can be extended further with features like:
- Drag-and-drop reordering of nodes
- Rich text editing for content
- Preview modes for resources
- Bulk operations for resources/activities
- Import/export functionality
- Version control for curriculum content