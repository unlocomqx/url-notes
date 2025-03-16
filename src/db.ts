import Dexie, {type EntityTable} from 'dexie'

export type Context = 'page' | 'website' | 'global'

export type Note= {
  id: number
  context: Context
  content: string
}

const db = new Dexie('NotesDatabase') as Dexie & {
  notes: EntityTable<
    Note,
    'id' // primary key "id" (for the typings only)
  >;
}

// Schema declaration:
db.version(1).stores({
  notes: '++id, context, content'
})

export {db}
