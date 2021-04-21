import {fromPromise} from "rxjs/internal-compatibility";
import React, {useContext, useEffect, useState} from "react";
import {ApiContext} from "./rapidapi";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {mergeMap} from "rxjs/operators";
import {SymbolCacheContext} from "./symbol-cache";

const { createContext } = React;

export const PositionContext = createContext(null);

export const PositionProvider = (props) => {

    let ret = new PositionHistory();
    ret.api = useContext(ApiContext);
    ret.sc = useContext(SymbolCacheContext);

    const value = {
        position: ret,
    };

    return (
        <PositionContext.Provider value={value}>
            {props.children}
        </PositionContext.Provider>
    );
};

export class PositionHistory {

    api = null;
    sc = null;

    getUser(){
        return getAuth().currentUser ? getAuth().currentUser.uid : null;
    }

    getUserCollection(){
        return doc(collection(getFirestore(), "users"), this.getUser());
    }

    getCache$(){
        return fromPromise(
            getDoc(this.getUserCollection())
        );
    }


    update$(value){
        return fromPromise(
            addDoc(collection(this.getUserCollection(), 'history'), {
                timestamp: new Date(),
                value: value,
            })
        );
    }

    sell$(pos, val){
        return fromPromise(
            deleteDoc(doc(collection(this.getUserCollection(), 'stocks'), pos))
        ).pipe(mergeMap(() => this.updateFunds$(val)));
    }

    buy$(pos, val){
        return this.getCache$().pipe(
            mergeMap(vDoc => {
                let nDoc = doc(collection(this.getUserCollection(), 'stocks'), "Position" + vDoc.data().positions);
                return fromPromise(
                    setDoc(nDoc, pos)
                )
            }),
            mergeMap(() => this.updateFunds$(val))
        );
    }

    updateFunds$(value){
        return fromPromise(
            updateDoc(this.getUserCollection(), {
                currentfunds: value,
            })
        );
    }

    updateWatchlist(doc){
        updateDoc(this.getUserCollection(), doc);
    }

    loadHistory$(){
        return fromPromise(
            getDocs(collection(this.getUserCollection(), 'history'))
        );
    }

    loadStocks$(){
        return fromPromise(
            getDocs(collection(this.getUserCollection(), 'stocks'))
        );
    }



}

export function usePosition(){

    const pos = useContext(PositionContext);
    const ac = useContext(ApiContext);

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState([]);
    const [canFetch, setCanFetch] = useState(true);
    const [callback, setCallback] = useState(null);
    const [doUpdate, setDoUpdate] = useState(true);

    let itemCount = items.length;
    let limit = 10;

    const getSymbolsToQuery = () => {
        return total.filter((collection, index) => index >= itemCount && index < itemCount + limit).map(item => item.data().symbol)
    }

    const {
        data,
        fetchNextPage,
        isFetching,
    } = ac.api.useFetchBulkQuotesQuery(getSymbolsToQuery(), {
        refetchOnWindowFocus: false,
        enabled: false,
        getNextPageParam: (lastPage, pages) => {
            return getSymbolsToQuery()
        }
    })();

    const reset = () => {
        setCanFetch(true);
        setItems([]);

    }

    const postUpdate = (sum) => {
        if(callback){
            if(doUpdate){
                pos.position.update$(sum).subscribe(value1 => {
                    callback();
                    reset();
                });
            } else {
                callback(sum);
                reset();
            }
        }
    }

    useEffect(()=> {

        if(canFetch && total.length == 0){
            postUpdate(100000);
        }

        if(!pos.position.getUser()) return;

        if(canFetch && total.length > 0 && itemCount < total.length){
            setCanFetch(false);
            fetchNextPage();
        }

        if(!canFetch && data && data.pages && !isFetching && itemCount < total.length){
            let newItems = [];
            data.pages.forEach((value) => {
                newItems = newItems.concat(value.result)
            });
            setCanFetch(true);
            setItems(newItems);
        }

        if(total.length > 0 && itemCount == total.length){

            pos.position.getCache$().subscribe(value => {
                let sum = parseFloat(value.data().currentfunds);
                for(let i in total){
                    let doc = total[i];
                    sum += parseFloat(doc.data().shares * items[i].regularMarketPrice);
                }
                if(callback){
                    postUpdate(sum);
                }
            });
        }

    }, [total, data, canFetch]);

    const handleUpdate = (f, noUpdate) => {
        pos.position.loadStocks$().subscribe((v) => {
            setCallback( () => f);
            setDoUpdate(!noUpdate);
            setTotal(v.docs);
        });
    }

    return handleUpdate;
}

export function UsePosition (props) {
    return props.children(usePosition());
}
