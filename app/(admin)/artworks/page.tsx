"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  List,
  Search,
  Eye,
  Heart,
  Flag,
  EyeOff,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import { mockArtworks, type MockArtwork } from "@/lib/mock-data";

const STYLES = [
  "Impressionniste",
  "Abstrait",
  "Réaliste",
  "Pop Art",
  "Minimaliste",
  "Surréaliste",
  "Cubiste",
  "Baroque",
];

const PAGE_SIZE = 12;

export default function ArtworksPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MockArtwork | null>(null);

  const debouncedSearch = useDebounce(search);

  const filtered = useMemo(() => {
    let items = [...mockArtworks];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.prompt.toLowerCase().includes(q) ||
          a.creator.toLowerCase().includes(q)
      );
    }
    if (styleFilter) items = items.filter((a) => a.style === styleFilter);
    if (statusFilter) items = items.filter((a) => a.status === statusFilter);
    return items;
  }, [debouncedSearch, styleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusBadge = (s: string) => {
    switch (s) {
      case "flagged":
        return <Badge variant="danger">Signalée</Badge>;
      case "hidden":
        return <Badge variant="warning">Masquée</Badge>;
      default:
        return <Badge variant="success">Publiée</Badge>;
    }
  };

  return (
    <>
      <Header title="Oeuvres" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-6"
      >
        {/* toolbar */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Rechercher titre, prompt, créateur..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-44">
            <Select
              options={STYLES.map((s) => ({ value: s, label: s }))}
              placeholder="Tous les styles"
              value={styleFilter}
              onChange={(e) => {
                setStyleFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={[
                { value: "published", label: "Publiées" },
                { value: "flagged", label: "Signalées" },
                { value: "hidden", label: "Masquées" },
              ]}
              placeholder="Tous les statuts"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
            <button
              onClick={() => setView("grid")}
              className={`rounded-md p-2 transition-colors ${
                view === "grid"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-md p-2 transition-colors ${
                view === "list"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-slate-500">
            {filtered.length} oeuvre{filtered.length !== 1 && "s"}
          </span>
        </div>

        {/* content */}
        <AnimatePresence mode="wait">
          {view === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {paginated.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelected(art)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute right-2 top-2">
                      {statusBadge(art.status)}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {art.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {art.creator} &middot; {art.style}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {art.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {art.views}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                        Image
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                        Titre / Prompt
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                        Créateur
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                        Style
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                        Likes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((art) => (
                      <tr
                        key={art.id}
                        onClick={() => setSelected(art)}
                        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-blue-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={art.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                            {art.title}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {art.creator}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="purple">{art.style}</Badge>
                        </td>
                        <td className="px-4 py-3">{statusBadge(art.status)}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {art.likes}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(art.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm text-slate-500">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* detail modal */}
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Détail de l'oeuvre"
          size="lg"
        >
          {selected && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.imageUrl}
                  alt={selected.title}
                  className="mx-auto max-h-80 object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Titre</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {selected.title}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Créateur</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {selected.creator}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Style</p>
                  <Badge variant="purple">{selected.style}</Badge>
                </div>
                <div>
                  <p className="text-slate-400">Statut</p>
                  {statusBadge(selected.status)}
                </div>
                <div>
                  <p className="text-slate-400">Prompt complet</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {selected.prompt}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Date</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" /> {selected.likes} likes
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {selected.views} vues
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<EyeOff className="h-4 w-4" />}
                >
                  Masquer
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Flag className="h-4 w-4" />}
                >
                  Signaler
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </>
  );
}
