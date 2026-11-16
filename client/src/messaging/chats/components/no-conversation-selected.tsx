export const NoConversationSelected: React.FC = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <div className="text-center">
      <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Bienvenido a Chats</p>
      <p className="mt-1 text-sm">Selecciona una conversación para ver los mensajes</p>
    </div>
  </div>
);
