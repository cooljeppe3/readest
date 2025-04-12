import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { MdCheck } from 'react-icons/md';
import {
  HiOutlineFolder,
  HiOutlineFolderAdd,
  HiOutlineFolderRemove,
} from 'react-icons/hi';

// Importing necessary types and utility functions
import { Book, BookGroupType } from '@/types/book';
import { isMd5, md5Fingerprint } from '@/utils/md5';
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useLibraryStore } from '@/store/libraryStore';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import {
  BOOK_UNGROUPED_ID,
  BOOK_UNGROUPED_NAME,
} from '@/services/constants';
import { generateGroupsList } from './BookshelfItem';

// Defining the props interface for the GroupingModal component
interface GroupingModalProps {
  libraryBooks: Book[]; // Array of all books in the library
  selectedBooks: string[]; // Array of hashes of the selected books
  onCancel: () => void; // Callback to handle cancellation
  onConfirm: () => void; // Callback to handle confirmation
}

// Defining the GroupingModal component
const GroupingModal: React.FC<GroupingModalProps> = ({
  libraryBooks,
  selectedBooks,
  onCancel,
  onConfirm,
}) => {
  // Hooks for accessing translations, environment variables, and the library store
  const _ = useTranslation();
  const { appService } = useEnv();
  const { setLibrary } = useLibraryStore();

  // Generate the initial list of groups based on the library books
  const groupsList = generateGroupsList(libraryBooks);

  const [showInput, setShowInput] = useState(false);
  const [editGroupName, setEditGroupName] = useState(_('Untitled Group'));
  const [selectedGroup, setSelectedGroup] = useState<BookGroupType | null>(null);
  const [newGroups, setNewGroups] = useState<BookGroupType[]>([]);
  const [allGroups, setAllGroups] = useState<BookGroupType[]>(groupsList);
  const editorRef = useRef<HTMLInputElement>(null);
  
  // Using a custom hook to get a responsive icon size
  const iconSize = useResponsiveSize(16);

  // Check if any selected book already belongs to a group
  const isSelectedBooksHasGroup =
    selectedBooks.some((hash) => !isMd5(hash)) || // Check if any selected book is not identified by MD5
    selectedBooks
      .map((hash) => libraryBooks.find((book) => book.hash === hash)?.groupId)
      .some(
        (group) => group && group !== BOOK_UNGROUPED_NAME,
      ); // Check if any book belongs to a group other than the ungrouped group

  // Function to handle the creation of a new group
  const handleCreateGroup = () => {
    setShowInput(true);
  };

  // Function to handle removing selected books from any group they belong to
  // and setting them to ungrouped
  const handleRemoveFromGroup = () => {
    selectedBooks.forEach((id) => {
      for (const book of libraryBooks.filter((book) => book.hash === id || book.groupId === id)) {
        if (
          book &&
          book.groupId &&
          book.groupName &&
          book.groupId !== BOOK_UNGROUPED_ID &&
          book.groupName !== BOOK_UNGROUPED_NAME
        ) {
          book.groupId = undefined;
          book.groupName = undefined;
          book.updatedAt = Date.now();
        }
      }
    });
    setLibrary(libraryBooks);
    appService?.saveLibraryBooks(libraryBooks);
    onConfirm();
  };

  // Function to confirm the creation of a new group
  const handleConfirmCreateGroup = () => {
    const groupName = editGroupName.trim();
    if (groupName) { // Ensure the group name is not empty
      const newGroup = {
        id: md5Fingerprint(groupName),
        name: groupName,
      }; // Create a new group object with a unique ID
      const existingGroupIndex = newGroups.findIndex(
        (group) => group.name === groupName,
      ); // Check for an existing group with the same name
      if (existingGroupIndex > -1) {
        newGroups.splice(existingGroupIndex, 1);
      }
      newGroups.push(newGroup); // Add the new group to the list of new groups
      setSelectedGroup(newGroup);
      setNewGroups(newGroups);
      for (const newGroup of newGroups) {
        const existingGroupIndex = groupsList.findIndex((group) => group.id === newGroup.id);
        if (existingGroupIndex > -1) {
          groupsList.splice(existingGroupIndex, 1);
        }
        groupsList.unshift(newGroup);
      } // Add new groups to the list of all groups
      setAllGroups(groupsList);
      // Check existing names for "Untitled Group" to find the next group index.
      const untitledGroupPattern = new RegExp(`^${_('Untitled Group')}\\s*(\\d+)?$`);
      const untitledGroupNumbers = groupsList
        .map((group) => {
          const match = group.name.match(untitledGroupPattern);
          return match ? parseInt(match[1] || '0', 10) : null;
        })
        .filter((num) => num !== null); //Filter non-numerical result

      // Generate the next "Untitled Group" name with incremented number
      const nextNumber =
        untitledGroupNumbers.length > 0 ? Math.max(...untitledGroupNumbers) + 1 : 1; // Find the next number
      setEditGroupName(`${_('Untitled Group')} ${nextNumber}`);
      setShowInput(false);
    }
  };

  const handleToggleSelectGroup = (group: BookGroupType) => {
    setSelectedGroup((prevGroup) => (prevGroup?.id === group.id ? null : group));
  };
  
  //Function to confirm the grouping operation
  const handleConfirmGrouping = () => {
    selectedBooks.forEach((id) => { // Loop through each selected book
      for (
        const book of libraryBooks.filter(
          (book) => book.hash === id || book.groupId === id,
        )) {
        if (book && selectedGroup) {
          book.groupId = selectedGroup.id;
          book.groupName = selectedGroup.name;
          book.updatedAt = Date.now();
        }
      }
    });
    setLibrary(libraryBooks);
    appService?.saveLibraryBooks(libraryBooks);
    onConfirm();
  };

  // useEffect to automatically focus on the input field when it's shown
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.select();
    }
  }, [showInput]); // Dependency array: this effect runs when showInput changes

  // useEffect to determine the selected group based on the selected books
  useEffect(() => {
    const groupIds = selectedBooks
      .map(
        (id) =>
          libraryBooks.find(
            (book) => book.hash === id || book.groupId === id,
          )?.groupId,
      )
      .filter((groupId) => groupId); // Get group IDs of selected books
    if (Array.from(new Set(groupIds)).length === 1) { // If all selected books have the same group ID
      setSelectedGroup(
        groupsList.find((group) => group.id === groupIds[0]) || null,
      ); // Set the selected group to that group
    } // Set to null if selected books dont have a group
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBooks]);

  return (
    // Modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Modal content box */}
      <div
        className={clsx(
          "modal-box bg-base-100 overflow-y-auto rounded-2xl shadow-xl",
          "max-h-[85%] w-[95%] min-w-64 max-w-[440px] p-6 sm:w-[70%]",
        )}
      >
        <h2 className="text-center text-lg font-bold">{_('Group Books')}</h2>
        <div className={clsx("mt-4 grid grid-cols-1 gap-2 text-base md:grid-cols-2")}>
          {isSelectedBooksHasGroup && (
            <div
              onClick={handleRemoveFromGroup}
              role='button'
              className='flex items-center space-x-2 p-2 text-blue-500'
            >
              <HiOutlineFolderRemove size={iconSize} />
              <span>{_('Remove From Group')}</span>
            </div>
          )}
          <div
            onClick={handleCreateGroup}
            role='button'
            className='flex items-center space-x-2 p-2 text-blue-500'
          >
            <HiOutlineFolderAdd size={iconSize} />
            <span>{_('Create New Group')}</span>
          </div>
        </div>
        {showInput && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type='text'
              autoFocus
              ref={editorRef}
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreateGroup();
                e.stopPropagation();
              }}
              className="input input-ghost w-full border-0 px-2 text-base !outline-none sm:text-sm"
            />
            <button
              className={clsx(
                "btn btn-ghost settings-content hover:bg-transparent",
                "flex h-[1.3em] min-h-[1.3em] items-end p-0",
                editorRef.current && editorRef.current.value
                  ? ""
                  : "btn-disabled !bg-opacity-0",
              )}
              onClick={() => handleConfirmCreateGroup()}
            >
              <div className="pr-1 align-bottom text-base text-blue-500 sm:text-sm">
                {_("Save")}
              </div>
            </button>
          </div>
        )}
        <ul className='groups-list mt-4 grid grid-cols-2 gap-2'>
          {allGroups.map((group, index) => (
            <button
              key={index}
              className={clsx("hover:bg-base-300 text-base-content flex w-full",
                "items-center justify-between rounded-md px-2 py-2",)}
              onClick={() => handleToggleSelectGroup(group)}
            >
              <div className="flex min-w-0 items-center">
                <span
                  style={{ minWidth: `${iconSize}px` }}
                >
                  <HiOutlineFolder size={iconSize} /> {/* Display folder icon */}
                </span>
                <span
                  className={clsx("mx-2 flex-1 truncate text-base sm:text-sm")}
                  style={{ minWidth: 0 }}
                >
                  {group.name} {/* Display the group name */}
                </span>
              </div>
              <span className="text-neutral-content flex shrink-0 text-sm">
                {selectedGroup && selectedGroup.id == group.id && ( //If the group is selected
                  <MdCheck className="fill-blue-500" size={iconSize} /> //show a check icon
                )}
              </span>
            </button>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-x-8 p-2">
          <button
            onClick={onCancel}
            className="flex items-center"
          >
            {_("Cancel")} {/* Cancel button */}
          </button>
          {/* Confirm button */}
          <button
            onClick={handleConfirmGrouping}
            className={clsx(
              'flex items-center text-blue-500',
              !selectedGroup && 'btn-disabled opacity-50',
            )}
          >
            {_('Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupingModal;
