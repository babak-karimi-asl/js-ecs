
const clone = a=>JSON.parse(JSON.stringify(a))
const ecs = {typeBuilders:{},UUID:1,systemsForType:{},objectsById:{},objects:[],objectsByType:{}}
ecs.addType = function(type,structure){
    if(type in this.typeBuilders){
        throw `CREATE TYPE ERROR: type "${type}" already exists`
        return 0
    }
    this.typeBuilders[type]=(init)=>{
        for(let k in init)
            if( !(k in structure) ) throw `CREATE OBJECT ERROR: object of type '${type}' does not have field '${k}'`
        for(let k in structure)
            if( !(k in init) ) init[k]=structure[k]
        let id = this.UUID++
        return new Proxy(clone(init),{
           get:function(obj, prop) {
               if(prop==='_type') return type
               if(prop==='_id') return id
               if(prop==='_deleted') return obj._deleted?1:0
               if(prop in obj) return obj[prop]
               else throw `GET ERROR: object of type '${type}' does not have property '${prop}'`
            },
           set:function(obj, prop,value) {
               if(prop==='_deleted'){
                    obj._deleted = value?1:0
                    return 
               }
               if(prop in obj) obj[prop]=value
               else throw `SET ERROR: object of type '${type}' does not have property '${prop}'`
           }
        })
    }
}

ecs.addSystem = function(inputType,fnc){
    if(!(inputType in this.typeBuilders)){
        throw `CREATE OBJECT ERROR: type '${inputType}' does not exist`
        return 0
    }
    if(!this.systemsForType[inputType])
       this.systemsForType[inputType]=[]
    this.systemsForType[inputType].push(fnc)
}

ecs.createObject = function(type,init={}){    
    if(!(type in this.typeBuilders)){
        throw `CREATE OBJECT ERROR: type '${type}' does not exist`
        return 0
    }
    return this.typeBuilders[type](init)
}

ecs.clearObjects =function(){
    this.objects=[]
    this.objectsById={}
    this.objectsByType={}
}

ecs.refreshObjects = function(){
    this.objects = this.objects.filter(o=>!o._deleted)
    this.objectsById = this.objects.reduce((acc,cur)=>(acc[cur._id]=cur,acc),{})
    this.objectsByType = {}
    for(let k in this.typeBuilders)
       this.objectsByType[k]=[]
    this.objectsByType = this.objects.reduce((acc,cur)=>{
        acc[cur._type].push(cur)
        return acc
    },this.objectsByType)
}

ecs.pushObject=function(object){
    this.objects.push(object)
    this.objectsById[object._id]=object
    if(!this.objectsByType[object._type])
       this.objectsByType[object._type] = []
    this.objectsByType[object._type].push(object)
}
ecs.deleteObject=function(object){
    object._deleted = true
}

ecs.tickSystems = function(){
    for(let k in this.systemsForType)
        for(let s of this.systemsForType[k])
          for(let o of this.objectsByType[k])
                 s(this,o)
    this.refreshObjects()
}

//////////////////////////////////

ecs.addType('player',{name:'player',health:0,damage:0})
ecs.addType('card',{place:'hands',size:'small'})

ecs.addSystem('player',(context,player)=>{
    console.log('system 1 got player',player);
    context.deleteObject(player)

})

ecs.addSystem('player',(context,player)=>{
    console.log('system 2 got player',player);
})

ecs.addSystem('card',(context,card)=>{
    console.log('system 3 got card',card);
    //context.deleteObject(card)
})

//////////////////////////////////////

ecs.pushObject( ecs.createObject('player',{name:'player1',health:22}) )
ecs.pushObject( ecs.createObject('player',{name:'player2',health:22}) )
ecs.pushObject( ecs.createObject('card',{place:'feild'}) )

ecs.tickSystems()
console.log('one run////////////////')
ecs.tickSystems()

console.log(ecs)

ecs.refreshObjects()

console.log(ecs)

