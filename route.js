// Priority Queue implementation for min-heap
class MinHeap {
    constructor() {
        this.heap = [];
    }

    push(item) {
        this.heap.push(item);
        this.heapifyUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown(0);
        return min;
    }

    heapifyUp(index) {
        if (index === 0) return;
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.heap[parentIndex][0] > this.heap[index][0]) {
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            this.heapifyUp(parentIndex);
        }
    }

    heapifyDown(index) {
        const leftChild = 2 * index + 1;
        const rightChild = 2 * index + 2;
        let smallest = index;

        if (leftChild < this.heap.length && this.heap[leftChild][0] < this.heap[smallest][0]) {
            smallest = leftChild;
        }
        if (rightChild < this.heap.length && this.heap[rightChild][0] < this.heap[smallest][0]) {
            smallest = rightChild;
        }

        if (smallest !== index) {
            [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
            this.heapifyDown(smallest);
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

let V = 0;
let adj = {};

function initializeGraph(nodes, edges) {
    var node1;
    var node2;
    var weight;
    var status;

    // Initialize adjacency list
    for (let k in nodes) {
        adj[k] = [];
    }

    V = Object.keys(adj).length;

    Object.values(edges).forEach(edge => {
        node1 = edge.startnodeid
        node2 = edge.endnodeid;
        weight = edge.distance;
        status = edge.status;

        if (status === 'Y') {
            adj[node1].push([node2, weight]);
            adj[node2].push([node1, weight]);
        }
        
    });
}

function findPath(src, dest) {
    const dist = {};
    const parent = {};

    // Initialize distances and parents
    for (let node in adj) {
        dist[node] = Infinity;
        parent[node] = -1;
    }

    dist[src] = 0;
    const minHeap = new MinHeap();
    minHeap.push([dist[src], src]);

    while (!minHeap.isEmpty()) {
        const u = minHeap.pop()[1];

        for (let [neighbor, weight] of adj[u]) {
            if (dist[u] + weight < dist[neighbor]) {
                dist[neighbor] = dist[u] + weight;
                parent[neighbor] = u;
                minHeap.push([dist[neighbor], neighbor]);
            }
        }
    }

    // If destination is unreachable
    if (dist[dest] === Infinity) {
        console.log("destination is unreachable");
        return [];
    }

    // Reconstruct path
    const path = [];
    let crawl = dest;
    while (crawl !== -1) {
        path.push(crawl);
        crawl = parent[crawl];
    }

    return path.reverse();
}