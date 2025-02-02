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

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pin,
  StarOutline,
  Unlock,
  Readonly,
  SyncOff,
  ArrowLeft,
  Circle,
  Checkmark,
  Lock
} from "../icons";
import { Flex, Text } from "@theme-ui/components";
import { useStore, store } from "../../stores/editor-store";
import { COLORS } from "../../common/constants";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useAttachmentStore } from "../../stores/attachment-store";
import { store as noteStore } from "../../stores/note-store";
import { AnimatedFlex } from "../animated";
import Toggle from "./toggle";
import ScrollContainer from "../scroll-container";
import Vault from "../../common/vault";
import TimeAgo from "../time-ago";
import { Attachment } from "../attachment";
import { formatBytes } from "@notesnook/common";
import { getTotalSize } from "../../common/attachments";
import Notebook from "../notebook";
import { getTotalNotes } from "@notesnook/common";
import Reminder from "../reminder";
import { getFormattedDate } from "@notesnook/common";

const tools = [
  { key: "pin", property: "pinned", icon: Pin, label: "Pin" },
  {
    key: "favorite",
    property: "favorite",
    icon: StarOutline,
    label: "Favorite"
  },
  { key: "lock", icon: Unlock, label: "Lock", property: "locked" },
  {
    key: "readonly",
    icon: Readonly,
    label: "Readonly",
    property: "readonly"
  },
  {
    key: "local-only",
    icon: SyncOff,
    label: "Disable sync",
    property: "localOnly"
  }
];

const metadataItems = [
  {
    key: "dateCreated",
    label: "Created at",
    value: (date) => getFormattedDate(date || Date.now())
  },
  {
    key: "dateEdited",
    label: "Last edited at",
    value: (date) => (date ? getFormattedDate(date) : "never")
  }
];

function Properties(props) {
  const { onOpenPreviewSession } = props;

  const [versionHistory, setVersionHistory] = useState([]);

  const toggleProperties = useStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const session = useStore((store) => store.session);
  const attachments = useAttachmentStore((store) =>
    store.attachments.filter((a) => a.noteIds.includes(session.id))
  );
  const {
    id: sessionId,
    color,
    notebooks = [],
    sessionType,
    dateCreated
  } = session;
  const isPreviewMode = sessionType === "preview";
  const reminders = db.relations.from(
    { id: session.id, type: "note" },
    "reminder"
  );
  const allNotebooks = useMemo(
    () => [
      ...notebooks.map((ref) => db.notebooks.notebook(ref.id)?.data),
      ...db.relations.to({ id: sessionId, type: "note" }, "notebook")
    ],
    [sessionId, notebooks]
  );

  const changeState = useCallback(
    function changeState(prop) {
      switch (prop) {
        case "lock":
          return store.get().session.locked
            ? noteStore.unlock(sessionId)
            : noteStore.lock(sessionId);
        case "readonly":
          return noteStore.readonly(sessionId);
        case "local-only":
          return noteStore.localOnly(sessionId);
        case "pin":
          return noteStore.pin(sessionId);
        case "favorite":
          return noteStore.favorite(sessionId);
        default:
          return;
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const history = await db.noteHistory.get(sessionId);
      setVersionHistory(history);
    })();
  }, [sessionId]);

  if (isFocusMode || !sessionId) return null;
  return (
    <>
      <AnimatedFlex
        animate={{
          x: 0
        }}
        transition={{
          duration: 0.1,
          bounceDamping: 1,
          bounceStiffness: 1,
          ease: "easeOut"
        }}
        initial={{ x: 600 }}
        sx={{
          display: "flex",
          position: "absolute",
          right: 0,
          zIndex: 3,
          height: "100%",
          width: "300px",
          borderLeft: "1px solid",
          borderLeftColor: "border",
          overflowY: "hidden",
          overflowX: "hidden",
          flexDirection: "column"
        }}
        bg="background"
        // px={2}
      >
        <ScrollContainer>
          <Card
            title="Properties"
            button={
              <ArrowLeft
                data-test-id="properties-close"
                onClick={() => toggleProperties(false)}
                size={18}
                sx={{ mr: 1, cursor: "pointer" }}
              />
            }
          >
            {!isPreviewMode && (
              <>
                {tools.map((tool) => (
                  <Toggle
                    {...tool}
                    key={tool.key}
                    toggleKey={tool.property}
                    onToggle={(state) => changeState(tool.key, state)}
                    testId={`properties-${tool.key}`}
                  />
                ))}
              </>
            )}
            {metadataItems.map((item) => (
              <Flex
                key={item.key}
                py={2}
                px={2}
                sx={{
                  borderBottom: "1px solid var(--separator)",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Text variant="subBody" sx={{ fontSize: "body" }}>
                  {item.label}
                </Text>
                <Text
                  className="selectable"
                  variant="subBody"
                  sx={{ fontSize: "body" }}
                >
                  {item.value(session[item.key])}
                </Text>
              </Flex>
            ))}
            {!isPreviewMode && (
              <>
                <Flex
                  py={2}
                  px={2}
                  sx={{
                    cursor: "pointer",
                    justifyContent: "center"
                  }}
                >
                  {COLORS.map((label) => (
                    <Flex
                      key={label}
                      onClick={() => noteStore.get().setColor(sessionId, label)}
                      sx={{
                        cursor: "pointer",
                        position: "relative",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                      data-test-id={`properties-${label}`}
                    >
                      <Circle
                        size={35}
                        color={label.toLowerCase()}
                        data-test-id={`toggle-state-${
                          label.toLowerCase() === color?.toLowerCase()
                            ? "on"
                            : "off"
                        }`}
                      />
                      {label.toLowerCase() === color?.toLowerCase() && (
                        <Checkmark
                          color="white"
                          size={18}
                          sx={{ position: "absolute", left: "8px" }}
                        />
                      )}
                    </Flex>
                  ))}
                </Flex>
              </>
            )}
          </Card>
          {allNotebooks?.length > 0 && (
            <Card title="Notebooks">
              {allNotebooks.map((notebook) => (
                <Notebook
                  key={notebook.id}
                  item={notebook}
                  date={notebook.dateCreated}
                  totalNotes={getTotalNotes(notebook)}
                  simplified
                />
              ))}
            </Card>
          )}
          {reminders?.length > 0 && (
            <Card title="Reminders">
              {reminders.map((reminder) => {
                return (
                  <Reminder key={reminder.id} item={reminder} simplified />
                );
              })}
            </Card>
          )}

          {attachments?.length > 0 && (
            <Card
              title="Attachments"
              subtitle={`${attachments.length} attachments | ${formatBytes(
                getTotalSize(attachments)
              )} occupied`}
            >
              <table style={{ borderSpacing: 0 }}>
                <tbody>
                  {attachments.map((attachment, i) => (
                    <Attachment
                      key={attachment.id}
                      compact
                      attachment={attachment}
                    />
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <Card
            title="Previous Sessions"
            subtitle={"Your session history is local only."}
          >
            {versionHistory.map((session) => {
              const fromDate = getFormattedDate(session.dateCreated, "date");
              const toDate = getFormattedDate(session.dateModified, "date");
              const fromTime = getFormattedDate(session.dateCreated, "time");
              const toTime = getFormattedDate(session.dateModified, "time");
              const label = `${fromDate}, ${fromTime} — ${
                fromDate !== toDate ? `${toDate}, ` : ""
              }${toTime}`;
              const isSelected =
                isPreviewMode && session.dateCreated === dateCreated;

              return (
                <Flex
                  key={session.id}
                  data-test-id={`session-item`}
                  py={1}
                  px={2}
                  sx={{
                    cursor: "pointer",
                    bg: isSelected ? "background-selected" : "transparent",
                    ":hover": {
                      bg: isSelected ? "hover-selected" : "hover"
                    },
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                  title="Click to preview"
                  onClick={async () => {
                    toggleProperties(false);
                    const content = await db.noteHistory.content(session.id);

                    if (session.locked) {
                      await Vault.askPassword(async (password) => {
                        try {
                          const decryptedContent =
                            await db.vault.decryptContent(content, password);
                          onOpenPreviewSession({
                            content: decryptedContent,
                            dateCreated: session.dateCreated,
                            dateEdited: session.dateModified
                          });
                          return true;
                        } catch (e) {
                          return false;
                        }
                      });
                    } else {
                      onOpenPreviewSession({
                        content,
                        dateCreated: session.dateCreated,
                        dateEdited: session.dateModified
                      });
                    }
                  }}
                >
                  <Text variant={"body"} data-test-id="title">
                    {label}
                  </Text>
                  <Flex
                    sx={{
                      fontSize: "subBody",
                      color: "paragraph-secondary"
                    }}
                  >
                    {session.locked && <Lock size={14} data-test-id="locked" />}
                    <TimeAgo
                      live
                      datetime={session.dateModified}
                      locale={"en_short"}
                    />
                  </Flex>
                </Flex>
              );
            })}
          </Card>
        </ScrollContainer>
      </AnimatedFlex>
    </>
  );
}
export default React.memo(Properties);

function Card({ title, subtitle, button, children }) {
  return (
    <Flex
      sx={{
        borderRadius: "default",
        flexDirection: "column"
      }}
    >
      <Flex mx={2} mt={2} sx={{ alignItems: "center" }}>
        {button}
        <Text variant="subtitle">{title}</Text>
      </Flex>
      {subtitle && (
        <Text variant="subBody" mb={1} mx={2}>
          {subtitle}
        </Text>
      )}
      {children}
    </Flex>
  );
}
