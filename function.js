import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTimeslotById(timeslotId) {
    if(timeslotId){
        const timeslot = await prisma.timeslot.findUnique({
            where: { id: timeslotId}
        })
        if(timeslot){
            return timeslot
        }
        else{
            throw {code: 404,error: new Error("Timeslot not found")}
        }
    }
}

export async function addStuToPeriod(periodIndex, timeslotId) {
    if(timeslotId){
        const timeslot = await prisma.timeslot.findUnique({
            where: {id: timeslotId}
        })        
        if(timeslot.is_full[periodIndex]){
            throw {code: 409,error: new Error("Timeslot full")}
        }
        const period = timeslot.period
        let newStuInPeriod = period    
        const intStu = parseInt(newStuInPeriod[periodIndex])+1
        newStuInPeriod[periodIndex] = intStu
        const updatedTimeslot = await prisma.timeslot.update({
            where: {id: timeslotId},
            data: {period: newStuInPeriod}
        })
        console.log(updatedTimeslot);    
        if(intStu == timeslot.max_stu){
            let isFull = timeslot.is_full
            isFull[periodIndex] = true
            await prisma.timeslot.update({
                where: {id: timeslotId},
                data: {is_full: isFull}
            })
        }
        return updatedTimeslot
    }
}

export async function delStuInPeriod(periodIndex, timeslotId) {
    if(timeslotId){
        const timeslot = await prisma.timeslot.findUnique({
            where: {id: timeslotId}
        })
        if(timeslot.period[periodIndex] == 0){
            throw {code: 409,error: new Error("Timeslot empty")}
        }
        const period = timeslot.period
        let newStuInPeriod = period    
        const intStu = parseInt(newStuInPeriod[periodIndex])-1
        newStuInPeriod[periodIndex] = intStu
        const updatedTimeslot = await prisma.timeslot.update({
            where: {id: timeslotId},
            data: {period: newStuInPeriod}
        })
        if(timeslot.is_full[periodIndex]){
            let isFull = timeslot.is_full
            isFull[periodIndex] = false
            await prisma.timeslot.update({
                where: {id: timeslotId},
                data: {is_full: isFull}
            })
        }
        return updatedTimeslot
    }
}

export async function getQueueById(id) {
    if(id){
        const queue = await prisma.queue.findUnique({
            where: {id: id},
        })
        if(queue){
            return queue
        }
        else{
            return 0
        }
    }
}

export async function cancleQueue(id) {
    if(id){
        const queue = await getQueueById(id)
        await delStuInPeriod(queue.period, queue.timeslot_id)
        const changeStatusQueue = await prisma.queue.update({
            where: {id: id},
            data: {status: "คิวถูกยกเลิก", deleted_at: new Date()}
        })
        return changeStatusQueue
    }
}

export async function changeQueue(queueId,studentId, reqId, timeslotId, period, uid) {    
    const timeslot = await getTimeslotById(timeslotId)

    const deleteCurrentQueue = await cancleQueue(queueId)
    if (!timeslot) {
        throw {code: 404,error: new Error("Timeslot not found")}
    }
    
    if(timeslot.is_full[period]){
        const createdQueue = await prisma.queue.create({
            data: {
                uid: uid,
                stu_id: studentId,
                req_id: reqId,
                timeslot_id: timeslotId,
                period: period,
                status: "คิวเต็ม"
            }
        });
        return createdQueue
    }
    await addStuToPeriod(period, timeslotId)
    const createdQueue = await prisma.queue.create({
        data: {
            uid: uid,
            stu_id: studentId,
            req_id: reqId,
            timeslot_id: timeslotId,
            period: period,
            status: "จองคิวสำเร็จ"
        }
    });
    const changeStatusReq = await prisma.request.update({
        where: {id: reqId},
        data: {status: "จองคิวแล้ว"}
    })
    return createdQueue
}

export async function createQueue(studentId, reqId, timeslotId, period, uid) {
    const timeslot = await getTimeslotById(timeslotId)
    if (!timeslot) {
        throw {code: 404,error: new Error("Timeslot not found")}
    }    
    if(timeslot.is_full[period]){
        const createdQueue = await prisma.queue.create({
            data: {
                uid: uid,
                stu_id: studentId,
                req_id: reqId,
                timeslot_id: timeslotId,
                period: period,
                status: "คิวเต็ม"
            }
        });
        return createdQueue
    }
    await addStuToPeriod(period, timeslotId)
    const createdQueue = await prisma.queue.create({
        data: {
            uid: uid,
            stu_id: studentId,
            req_id: reqId,
            timeslot_id: timeslotId,
            period: period,
            status: "จองคิวสำเร็จ"
        }
    });
    const changeStatusReq = await prisma.request.update({
        where: {id: reqId},
        data: {status: "จองคิวแล้ว"}
    })
    return createdQueue
}