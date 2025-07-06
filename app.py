from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, ReturnDocument
from datetime import datetime
from bson import ObjectId

app = Flask(__name__)
CORS(app)

client = MongoClient(
    "mongodb+srv://ramhex:RPNh7DSdREikvBiP@blogdentistas.g21owku.mongodb.net/"
    "?retryWrites=true&w=majority"
)
db = client.blogDentistas
collection = db.articulos

@app.route('/publicar', methods=['POST'])
def publicar():
    data = request.json or {}
    titulo    = data.get('titulo')
    contenido = data.get('contenido')
    autor     = data.get('autor')
    categoria = data.get('categoria')
    imagen    = data.get('imagen', '')

    if not all([titulo, contenido, autor, categoria]):
        return jsonify({"error": "Faltan campos obligatorios"}), 400

    articulo = {
        "titulo":   titulo,
        "contenido":contenido,
        "autor":    autor,
        "categoria":categoria,
        "imagen":   imagen,
        "fecha":    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "likes":    0,
        "dislikes": 0
    }
    result = collection.insert_one(articulo)
    return jsonify({
        "mensaje": "Artículo publicado exitosamente",
        "id":      str(result.inserted_id)
    }), 201

@app.route('/articulos', methods=['GET'])
def obtener_articulos():
    articulos = list(collection.find({}))
    for art in articulos:
        art["_id"] = str(art["_id"])
    return jsonify(articulos), 200

@app.route('/articulos/<id>', methods=['PUT'])
def editar_articulo(id):
    data = request.json or {}
    actualizacion = {
        "titulo":   data.get("titulo"),
        "contenido":data.get("contenido"),
        "autor":    data.get("autor"),
        "categoria":data.get("categoria"),
        "imagen":   data.get("imagen", "")
    }

    if not all([actualizacion["titulo"],
                actualizacion["contenido"],
                actualizacion["autor"],
                actualizacion["categoria"]]):
        return jsonify({"error": "Faltan campos para la edición"}), 400

    try:
        result = collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": actualizacion}
        )
    except:
        return jsonify({"error": "ID inválido"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "No se encontró el artículo"}), 404

    return jsonify({"mensaje": "Artículo actualizado correctamente"}), 200

@app.route('/articulos/<id>', methods=['DELETE'])
def eliminar_articulo(id):
    try:
        result = collection.delete_one({"_id": ObjectId(id)})
    except:
        return jsonify({"error": "ID inválido"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "No se encontró el artículo"}), 404

    return jsonify({"mensaje": "Artículo eliminado correctamente"}), 200

@app.route('/categorias-contador', methods=['GET'])
def contar_categorias():
    pipeline = [
        {"$group": {"_id": "$categoria", "cantidad": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    resultados = list(collection.aggregate(pipeline))
    conteos = {item["_id"]: item["cantidad"] for item in resultados}
    return jsonify(conteos), 200

@app.route('/articulos/<id>/like', methods=['POST'])
def dar_like(id):
    try:
        updated = collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$inc": {"likes": 1}},
            return_document=ReturnDocument.AFTER
        )
    except:
        return jsonify({"error": "ID inválido"}), 400

    if not updated:
        return jsonify({"error": "No se encontró el artículo"}), 404

    return jsonify({
        "likes":  updated["likes"],
        "mensaje":"Like registrado"
    }), 200

@app.route('/articulos/<id>/dislike', methods=['POST'])
def dar_dislike(id):
    try:
        updated = collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$inc": {"dislikes": 1}},
            return_document=ReturnDocument.AFTER
        )
    except:
        return jsonify({"error": "ID inválido"}), 400

    if not updated:
        return jsonify({"error": "No se encontró el artículo"}), 404

    return jsonify({
        "dislikes": updated["dislikes"],
        "mensaje":  "Dislike registrado"
    }), 200

if __name__ == '__main__':
    app.run(debug=True)