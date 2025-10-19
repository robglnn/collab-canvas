graph TB
    subgraph "Firestore Database Structure"
        Root[🔥 Firestore Root]
        
        Root --> Canvases[📁 canvases/]
        
        Canvases --> MainCanvas[📄 main/<br/>Single Shared Canvas]
        
        MainCanvas --> Metadata[📋 metadata<br/>Document]
        MainCanvas --> ObjectsColl[📁 objects/<br/>Collection]
        MainCanvas --> CursorsColl[📁 cursors/<br/>Collection]
        MainCanvas --> PresenceColl[📁 presence/<br/>Collection]
        MainCanvas --> CommentsColl[📁 comments/<br/>Collection<br/>PR #23]
        
        Metadata --> MetaFields["FIELDS:<br/>ownerId: string<br/>createdAt: timestamp"]
        
        ObjectsColl --> Obj1[📄 object_uuid_1]
        ObjectsColl --> Obj2[📄 object_uuid_2]
        ObjectsColl --> ObjN[📄 object_uuid_n]
        
        Obj1 --> ObjFields["FIELDS:<br/>id: string<br/>type: rectangle<br/>x: number<br/>y: number<br/>width: number<br/>height: number<br/>createdBy: userId<br/>lockedBy: userId or null<br/>updatedAt: timestamp"]
        
        CursorsColl --> Cur1[📄 userId_1]
        CursorsColl --> Cur2[📄 userId_2]
        CursorsColl --> CurN[📄 userId_n]
        
        Cur1 --> CurFields["FIELDS:<br/>userId: string<br/>userName: string<br/>x: number<br/>y: number<br/>lastUpdate: timestamp"]
        
        PresenceColl --> Pres1[📄 userId_1]
        PresenceColl --> Pres2[📄 userId_2]
        PresenceColl --> PresN[📄 userId_n]
        
        Pres1 --> PresFields["FIELDS:<br/>userId: string<br/>userName: string<br/>userEmail: string<br/>photoURL: string or null<br/>role: owner or collaborator<br/>online: boolean<br/>kicked: boolean<br/>lastSeen: timestamp"]
        
        CommentsColl --> Comm1[📄 comment_uuid_1]
        CommentsColl --> Comm2[📄 comment_uuid_2]
        CommentsColl --> CommN[📄 comment_uuid_n]
        
        Comm1 --> CommFields["FIELDS:<br/>id: string<br/>shapeId: string<br/>text: string (max 200)<br/>userId: string<br/>userName: string<br/>userInitials: string<br/>createdAt: timestamp<br/>updatedAt: timestamp<br/>deleted: boolean<br/>deletedAt: timestamp or null"]
    end
    
    subgraph "Real-Time Listeners"
        Listen1[🔔 onSnapshot<br/>objects/]
        Listen2[🔔 onSnapshot<br/>cursors/]
        Listen3[🔔 onSnapshot<br/>presence/]
        Listen4[🔔 onSnapshot<br/>metadata]
        Listen5[🔔 onSnapshot<br/>comments/]
        
        ObjectsColl -.Subscribe.-> Listen1
        CursorsColl -.Subscribe.-> Listen2
        PresenceColl -.Subscribe.-> Listen3
        Metadata -.Subscribe.-> Listen4
        CommentsColl -.Subscribe.-> Listen5
        
        Listen1 -.Updates.-> ShapeSync[Shape Creation<br/>& Movement Sync]
        Listen2 -.Updates.-> CursorSync[Cursor Position<br/>Updates]
        Listen3 -.Updates.-> PresenceSync[User Join/Leave<br/>Status]
        Listen4 -.Updates.-> OwnerSync[Owner ID<br/>Verification]
        Listen5 -.Updates.-> CommentSync[Comments<br/>Real-Time Updates]
    end
    
    subgraph "Security Rules Logic"
        Rules[🔒 Firestore Security Rules]
        
        Rules --> Rule1["✅ Allow read/write if<br/>authenticated"]
        Rules --> Rule2["✅ Users can only update<br/>their own cursor"]
        Rules --> Rule3["✅ Users can only update<br/>their own presence"]
        Rules --> Rule4["✅ Owner can update<br/>any presence (kick)"]
        Rules --> Rule5["✅ Anyone can create/update<br/>objects (with lock check)"]
        Rules --> Rule6["✅ Anyone can create/update<br/>comments (PR #23)"]
    end
    
    subgraph "Write Operations"
        Write1[✍️ Create Object]
        Write2[✍️ Update Object]
        Write3[✍️ Lock/Unlock Object]
        Write4[✍️ Update Cursor]
        Write5[✍️ Set Presence]
        Write6[✍️ Kick User]
        Write7[✍️ Add Comment]
        Write8[✍️ Update Comment]
        Write9[✍️ Delete Comment]
        
        Write1 --> ObjectsColl
        Write2 --> ObjectsColl
        Write3 --> ObjectsColl
        Write4 --> CursorsColl
        Write5 --> PresenceColl
        Write6 --> PresenceColl
        Write7 --> CommentsColl
        Write8 --> CommentsColl
        Write9 --> CommentsColl
    end
    
    subgraph "Read Operations"
        Read1[📖 Get All Objects]
        Read2[📖 Get All Cursors]
        Read3[📖 Get All Presence]
        Read4[📖 Get Metadata]
        Read5[📖 Get Comments<br/>by ShapeId]
        
        ObjectsColl --> Read1
        CursorsColl --> Read2
        PresenceColl --> Read3
        Metadata --> Read4
        CommentsColl --> Read5
    end
    
    %% Styling
    classDef collection fill:#ffa500,stroke:#333,stroke-width:3px
    classDef document fill:#ffd700,stroke:#333,stroke-width:2px
    classDef fields fill:#90ee90,stroke:#333,stroke-width:1px
    classDef listener fill:#61dafb,stroke:#333,stroke-width:2px
    classDef operation fill:#ff6b6b,stroke:#333,stroke-width:2px
    
    class Canvases,MainCanvas,ObjectsColl,CursorsColl,PresenceColl,CommentsColl collection
    class Metadata,Obj1,Obj2,ObjN,Cur1,Cur2,CurN,Pres1,Pres2,PresN,Comm1,Comm2,CommN document
    class MetaFields,ObjFields,CurFields,PresFields,CommFields fields
    class Listen1,Listen2,Listen3,Listen4,Listen5,ShapeSync,CursorSync,PresenceSync,OwnerSync,CommentSync listener
    class Write1,Write2,Write3,Write4,Write5,Write6,Write7,Write8,Write9,Read1,Read2,Read3,Read4,Read5 operation