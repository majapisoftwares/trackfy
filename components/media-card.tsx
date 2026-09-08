"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookmarkMinus,
  BookmarkPlus,
  Check,
  CircleCheck,
  Info,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import { useAuthSession } from "@/src/lib/auth/client";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { useTracking } from "@/src/lib/tracking/client";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { DropdownMenu, type DropdownMenuItem } from "./interior/dropdown";
import { CustomListPicker } from "./custom-list-picker";

function getContentHref(item: MediaItem) {
  if (item.source === "jikan" && item.id === 5114) {
    return "/animes/fullmetal-alchemist-brotherhood";
  }
  if (item.externalUrl) return item.externalUrl;
  return item.mediaType === "movie" ? `/movie/${item.id}` : `/series/${item.id}`;
}

function MediaCardDropdown({
  item,
  posterUrl,
  href,
}: {
  item: MediaItem;
  posterUrl: string | null;
  href: string;
}) {
  const router = useRouter();
  const session = useAuthSession();
  const isLogged = Boolean(session.data?.user);
  const [listPickerOpen, setListPickerOpen] = useState(false);

  const { entry, update } = useTracking(item.mediaType, item.id, {
    title: item.title,
    posterUrl,
  });

  const watched = entry?.watched ?? false;
  const inList = entry?.inList ?? false;

  const menuItems: DropdownMenuItem[] = [
    {
      value: "my-list",
      label: inList ? "Remover da minha lista" : "Adicionar à minha lista",
      icon: inList ? (
        <BookmarkMinus size={14} className="text-white" aria-hidden="true" />
      ) : (
        <BookmarkPlus size={14} aria-hidden="true" />
      ),
      active: inList,
      onClick: () => {
        if (!isLogged) {
          router.push("/login");
          return;
        }
        if (inList) update({ inList: false });
        else setListPickerOpen(true);
      },
    },
    {
      value: "info",
      label: "Ver detalhes",
      icon: <Info size={14} aria-hidden="true" />,
      onClick: () => {
        router.push(href);
      },
    },
    {
      value: "watched",
      label: watched ? "Marcar como não assistido" : "Marcar como assistido",
      icon: watched ? (
        <CircleCheck size={14} className="text-white" aria-hidden="true" />
      ) : (
        <Check size={14} aria-hidden="true" />
      ),
      active: watched,
      onClick: () => {
        if (!isLogged) {
          router.push("/login");
          return;
        }
        update({ watched: !watched });
      },
    },
  ];

  return <>
    <DropdownMenu items={menuItems} side="top" align="right" label={`Opções de ${item.title}`} trigger={<span className="media-card-menu-trigger" aria-hidden="true"><MoreVertical size={15} /></span>} />
    <CustomListPicker open={listPickerOpen} onOpenChange={setListPickerOpen} mediaType={item.mediaType} mediaId={item.id} title={item.title} posterUrl={posterUrl} onDefaultSave={() => update({ inList: true })} />
  </>;
}

export function MediaCard({
  item,
}: {
  item: MediaItem;
  showQuickActions?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const posterUrl = item.posterUrl ?? getTMDBImageUrl(item.posterPath, "w500");
  const href = getContentHref(item);
  const typeLabel = item.source === "jikan" ? "Anime" : item.mediaType === "movie" ? "Filme" : "Série";
  const isExternal = Boolean(item.externalUrl);

  return (
    <article className="media-card" data-ranking-position={item.rankingPosition}>
      <Link
        className="media-card-link"
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        aria-label={`Ver detalhes de ${item.title}`}
      >
        <div className="poster-frame">
          {failed || !posterUrl ? (
            <span className="poster-fallback">Imagem indisponível</span>
          ) : isExternal ? (
            // Jikan posters are loaded in the browser so this catalogue does
            // not depend on the server's outbound network configuration.
            <img
              className="poster-image"
              src={posterUrl}
              alt={`Pôster de ${item.title}`}
              onError={() => setFailed(true)}
            />
          ) : (
            <Image
              className="poster-image"
              src={posterUrl}
              alt={`Pôster de ${item.title}`}
              fill
              sizes="(max-width: 640px) 180px, (max-width: 900px) 220px, 240px"
              onError={() => setFailed(true)}
            />
          )}
        </div>
      </Link>
      <div className="media-meta">
        <div className="media-text">
          <div className="media-title-row">
            <Link
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              className="media-title-link"
              title={item.title}
            >
              <h3 className="media-title">{item.title}</h3>
            </Link>
            {!isExternal && (
              <MediaCardDropdown item={item} posterUrl={posterUrl} href={href} />
            )}
          </div>
          <p className="media-year">
            {item.year ?? "Data indisponível"} · {typeLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
