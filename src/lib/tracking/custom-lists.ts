import { randomUUID } from "node:crypto";
import type { Collection } from "mongodb";
import { getDatabase } from "@/src/lib/server/mongodb";
import type { TrackingMediaType } from "./types";

export type CustomListItem = {
  mediaType: TrackingMediaType;
  mediaId: number;
  title: string;
  posterUrl: string | null;
};

export type CustomList = {
  id: string;
  ownerId: string;
  name: string;
  items: CustomListItem[];
  createdAt: string;
  updatedAt: string;
};

type CustomListDocument = Omit<CustomList, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
};

async function getCollection(): Promise<Collection<CustomListDocument>> {
  const database = await getDatabase();
  const collection = database.collection<CustomListDocument>("custom_lists");
  await collection.createIndex({ ownerId: 1, createdAt: 1 });
  await collection.createIndex({ ownerId: 1, id: 1 }, { unique: true });
  return collection;
}

function serialize(document: CustomListDocument): CustomList {
  return {
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function listCustomLists(ownerId: string) {
  const documents = await (await getCollection())
    .find({ ownerId })
    .sort({ createdAt: 1 })
    .toArray();
  return documents.map(serialize);
}

export async function findCustomList(ownerId: string, id: string) {
  const document = await (await getCollection()).findOne({ ownerId, id });
  return document ? serialize(document) : null;
}

export async function createCustomList(ownerId: string, name: string) {
  const now = new Date();
  const document: CustomListDocument = {
    id: randomUUID(), ownerId, name, items: [], createdAt: now, updatedAt: now,
  };
  await (await getCollection()).insertOne(document);
  return serialize(document);
}

export async function addToCustomList(
  ownerId: string,
  listId: string,
  item: CustomListItem,
) {
  const collection = await getCollection();
  const now = new Date();
  await collection.updateOne(
    { ownerId, id: listId },
    {
      $pull: { items: { mediaType: item.mediaType, mediaId: item.mediaId } },
      $set: { updatedAt: now },
    },
  );
  const result = await collection.findOneAndUpdate(
    { ownerId, id: listId },
    { $push: { items: item }, $set: { updatedAt: now } },
    { returnDocument: "after" },
  );
  return result ? serialize(result) : null;
}
