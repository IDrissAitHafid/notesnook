/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ThemeDark, ThemeLight, useThemeEngineStore } from "@notesnook/theme";
import { Appearance } from "react-native";
import create from "zustand";
import { db } from "../app/common/database";
import { MMKV } from "../app/common/database/mmkv";
export async function initDatabase() {
  if (!db.isInitialized) {
    await db.init();
  } else {
    await db.initCollections();
  }
  await db.notes.init();
}

const StorageKeys = {
  appendNote: "shareMenuAppendNote",
  selectedNotebooks: "shareMenuSelectedNotebooks",
  selectedTag: "shareMenuSelectedTag",
  appSettings: "appSettings"
};

let appSettings = MMKV.getString(StorageKeys.appSettings);
if (appSettings) {
  appSettings = JSON.parse(appSettings);
}
const theme =
  Appearance.getColorScheme() !== "dark"
    ? appSettings?.darkThem
    : appSettings?.lightTheme;

useThemeEngineStore
  .getState()
  .setTheme(
    theme || (Appearance.getColorScheme() === "dark" ? ThemeDark : ThemeLight)
  );

export const useShareStore = create((set) => ({
  theme:
    theme || (Appearance.getColorScheme() === "dark" ? ThemeDark : ThemeLight),
  appendNote: null,
  setAppendNote: (note) => {
    MMKV.setItem(StorageKeys.appendNote, JSON.stringify(note));
    set({ appendNote: note });
  },
  restore: () => {
    let appendNote = MMKV.getString(StorageKeys.appendNote);
    let selectedNotebooks = MMKV.getString(StorageKeys.selectedNotebooks);
    let selectedTags = MMKV.getString(StorageKeys.selectedTag);
    appendNote = JSON.parse(appendNote);
    set({
      appendNote: appendNote ? JSON.parse(appendNote) : null,
      selectedNotebooks: selectedNotebooks ? JSON.parse(selectedNotebooks) : [],
      selectedTag: selectedTags ? JSON.parse(selectedTags) : []
    });
  },
  selectedTags: [],
  selectedNotebooks: [],
  setSelectedNotebooks: (selectedNotebooks) => {
    MMKV.setItem(
      StorageKeys.selectedNotebooks,
      JSON.stringify(selectedNotebooks)
    );
    set({ selectedNotebooks });
  },
  setSelectedTags: (selectedTags) => {
    MMKV.setItem(StorageKeys.selectedTag, JSON.stringify(selectedTags));
    set({ selectedTags });
  }
}));
