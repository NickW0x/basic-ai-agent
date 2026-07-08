"use client";

import { ReplacementHint } from "@/components/settings/replacement-hint";
import {
  RuntimeConnectionPanel,
  SettingsPageHeader,
} from "@/components/settings/settings-page-header";
import { SettingsSummaryGrid } from "@/components/settings/settings-summary-grid";
import { useSettingsDraft } from "@/components/settings/settings-draft-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type {
  DocumentIndexStatus,
  KnowledgeDocument,
  KnowledgeSource,
} from "@/lib/settings-runtime-contract";
import { cn } from "@/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DatabaseIcon,
  FileIcon,
  GlobeIcon,
  HardDriveIcon,
  UploadCloudIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type SortKey = "name" | "updatedAt" | "chunkCount" | "indexStatus";
type SortDir = "asc" | "desc";

const SOURCE_ICONS: Record<KnowledgeSource["type"], typeof FileIcon> = {
  upload: UploadCloudIcon,
  website: GlobeIcon,
  google_drive: HardDriveIcon,
  notion: FileIcon,
};

const STATUS_VARIANT: Record<
  KnowledgeSource["status"],
  "default" | "secondary" | "outline"
> = {
  connected: "default",
  syncing: "secondary",
  unconfigured: "outline",
};

const INDEX_VARIANT: Record<
  DocumentIndexStatus,
  "default" | "secondary" | "outline"
> = {
  indexed: "default",
  pending: "secondary",
  stale: "outline",
};

export function KnowledgeDashboard() {
  const { state, updateState } = useSettingsDraft();
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dragOver, setDragOver] = useState(false);

  const indexedCount = state.knowledgeDocuments.filter(
    (d) => d.indexStatus === "indexed",
  ).length;

  const sortedDocuments = useMemo(() => {
    const docs = [...state.knowledgeDocuments];
    docs.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === "updatedAt") {
        cmp = a.updatedAt.localeCompare(b.updatedAt);
      } else if (sortKey === "chunkCount") {
        cmp = a.chunkCount - b.chunkCount;
      } else {
        cmp = a.indexStatus.localeCompare(b.indexStatus);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return docs;
  }, [state.knowledgeDocuments, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortButton = ({ label, column }: { label: string; column: SortKey }) => (
    <button
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      onClick={() => toggleSort(column)}
      type="button"
    >
      {label}
      {sortKey === column ? (
        sortDir === "asc" ? (
          <ArrowUpIcon className="size-3" />
        ) : (
          <ArrowDownIcon className="size-3" />
        )
      ) : null}
    </button>
  );

  const addMockUpload = useCallback(
    (fileName: string) => {
      const id = `doc-${Date.now()}`;
      const doc: KnowledgeDocument = {
        id,
        name: fileName,
        sourceId: "upload",
        sourceName: "File upload",
        chunkCount: 0,
        indexStatus: "pending",
        updatedAt: new Date().toISOString(),
        fileType: fileName.split(".").pop() ?? "file",
      };
      updateState((prev) => ({
        ...prev,
        knowledgeDocuments: [doc, ...prev.knowledgeDocuments],
        knowledgeSources: prev.knowledgeSources.map((s) =>
          s.id === "upload"
            ? { ...s, documentCount: s.documentCount + 1, status: "syncing" as const }
            : s,
        ),
      }));
    },
    [updateState],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    addMockUpload(file?.name ?? "uploaded-file.pdf");
  };

  const updateRag = (patch: Partial<typeof state.ragSettings>) => {
    updateState((prev) => ({
      ...prev,
      ragSettings: { ...prev.ragSettings, ...patch },
    }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      <SettingsPageHeader
        description="Ground answers with xAI Collections — wired to search_knowledge in phase 2."
        stat={`${state.knowledgeDocuments.length} documents`}
        title="Knowledge Base"
      />

      <RuntimeConnectionPanel>
        <p>
          Collections power <code>collections_search</code> and{" "}
          <code>file_search</code> on xAI. Phase 2 adds{" "}
          <code>agent/tools/search_knowledge.ts</code> for eve text sessions and
          mirrors collection IDs in Grok voice <code>session.update.tools</code>.
        </p>
      </RuntimeConnectionPanel>

      <SettingsSummaryGrid
        stats={[
          {
            label: "Documents",
            value: state.knowledgeDocuments.length,
            icon: DatabaseIcon,
          },
          { label: "Indexed", value: indexedCount },
          {
            label: "Sources connected",
            value: state.knowledgeSources.filter((s) => s.status === "connected")
              .length,
          },
          {
            label: "Collection ID",
            value: (
              <span className="font-mono text-base">
                {state.knowledgeSources.find((s) => s.collectionId)?.collectionId ??
                  "—"}
              </span>
            ),
          },
        ]}
      />

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Sources</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {state.knowledgeSources.map((source) => {
            const Icon = SOURCE_ICONS[source.type];
            return (
              <Card className="gap-0 py-0" key={source.id}>
                <CardHeader className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{source.name}</CardTitle>
                      <CardDescription>
                        {source.documentCount} document
                        {source.documentCount === 1 ? "" : "s"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 px-4 pb-4">
                  <Badge variant={STATUS_VARIANT[source.status]}>
                    {source.status}
                  </Badge>
                  {source.collectionId ? (
                    <span className="font-mono text-muted-foreground text-xs">
                      {source.collectionId}
                    </span>
                  ) : null}
                  {source.status === "unconfigured" ? (
                    <Button size="sm" type="button" variant="outline">
                      Connect
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Upload</h3>
        <div
          className={cn(
            "rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20",
          )}
          onDragLeave={() => setDragOver(false)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDrop={handleDrop}
        >
          <UploadCloudIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-medium text-sm">Drag files here (preview mock)</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Phase 2: xAI <code>upload_document</code> + processing poll
          </p>
          <Button
            className="mt-4"
            onClick={() => addMockUpload(`sample-${Date.now()}.pdf`)}
            type="button"
            variant="secondary"
          >
            Add sample document
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Documents</h3>
        <div className="hidden overflow-hidden rounded-xl border md:block">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3">
                  <SortButton column="name" label="Name" />
                </th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">
                  <SortButton column="chunkCount" label="Chunks" />
                </th>
                <th className="px-4 py-3">
                  <SortButton column="indexStatus" label="Status" />
                </th>
                <th className="px-4 py-3">
                  <SortButton column="updatedAt" label="Updated" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDocuments.map((doc) => (
                <tr className="border-b last:border-0" key={doc.id}>
                  <td className="px-4 py-3 font-medium">{doc.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doc.sourceName}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{doc.chunkCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={INDEX_VARIANT[doc.indexStatus]}>
                      {doc.indexStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 md:hidden">
          {sortedDocuments.map((doc) => (
            <Card className="gap-2 py-3" key={doc.id}>
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm">{doc.name}</CardTitle>
                <CardDescription>{doc.sourceName}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 px-4">
                <Badge variant={INDEX_VARIANT[doc.indexStatus]}>
                  {doc.indexStatus}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {doc.chunkCount} chunks
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Accordion className="rounded-xl border px-4" collapsible type="single">
        <AccordionItem value="rag">
          <AccordionTrigger className="text-sm hover:no-underline">
            RAG settings
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label>Top K results</Label>
                  <ReplacementHint hintKey="knowledge.topK" />
                </div>
                <span className="font-mono text-sm tabular-nums">
                  {state.ragSettings.topK}
                </span>
              </div>
              <Slider
                max={20}
                min={1}
                onValueChange={([v]) => updateRag({ topK: v })}
                step={1}
                value={[state.ragSettings.topK]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Chunk size (read-only)</Label>
                <Input
                  disabled
                  value={String(state.ragSettings.chunkSize)}
                />
                <p className="text-muted-foreground text-xs">
                  Managed by xAI Collections indexing
                </p>
              </div>
              <div className="space-y-2">
                <Label>Embedding model</Label>
                <Input disabled value={state.ragSettings.embeddingModel} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
