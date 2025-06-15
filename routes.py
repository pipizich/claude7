from flask import render_template, request, jsonify, url_for
import os
import uuid
from db import get_db_connection
from image_utils import allowed_file, optimize_image
from config import UPLOAD_FOLDER

def register_routes(app):
    @app.route('/')
    def index():
        conn = get_db_connection()
        # Đổi thứ tự để ảnh mới nhất xuất hiện đầu tiên
        artworks = conn.execute('SELECT * FROM artworks ORDER BY position DESC').fetchall()
        conn.close()
        return render_template('index.html', artworks=artworks)

    @app.route('/add', methods=['POST'])
    def add_artwork():
        try:
            if 'image' not in request.files:
                return jsonify({'success': False, 'message': 'No image selected'}), 400
                
            file = request.files['image']
            if file.filename == '':
                return jsonify({'success': False, 'message': 'No image selected'}), 400
                
            if not file or not allowed_file(file.filename):
                return jsonify({'success': False, 'message': 'Invalid file type. Please select: JPG, PNG, GIF, WebP, SVG'}), 400
                
            file.seek(0, 2)
            file_length = file.tell()
            file.seek(0)
            if file_length > 15 * 1024 * 1024:
                return jsonify({'success': False, 'message': f'File too large ({file_length // 1024 // 1024}MB). Max size: 15MB'}), 400
                
            filename = file.filename
            ext = filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4()}.{ext}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            
            if ext != 'svg':
                optimized = optimize_image(file)
                with open(file_path, 'wb') as f:
                    f.write(optimized.read())
            else:
                file.save(file_path)
            
            title = request.form.get('title', '').strip()
            description = request.form.get('description', '').strip()
            
            # Description là optional - không bắt buộc
            if not description:
                description = "No description provided"
            
            conn = get_db_connection()
            # Lấy position cao nhất và tăng thêm 1 để ảnh mới xuất hiện đầu tiên
            max_pos = conn.execute('SELECT MAX(position) FROM artworks').fetchone()[0] or 0
            new_pos = max_pos + 1
            
            conn.execute(
                'INSERT INTO artworks (title, description, image_path, position) VALUES (?, ?, ?, ?)',
                (title if title else None, description, f"static/uploads/{unique_filename}", new_pos)
            )
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Artwork added successfully!',
                'redirect': url_for('index')
            })
            
        except Exception as e:
            if 'file_path' in locals() and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
            return jsonify({'success': False, 'message': f'Failed to add artwork: {str(e)}'}), 500

    @app.route('/edit/<int:id>', methods=['POST'])
    def edit_artwork(id):
        try:
            title = request.form.get('title', '').strip()
            description = request.form.get('description', '').strip()
            
            # Description là optional - không bắt buộc
            if not description:
                description = "No description provided"
            
            conn = get_db_connection()
            artwork = conn.execute('SELECT * FROM artworks WHERE id = ?', (id,)).fetchone()
            
            if not artwork:
                return jsonify({'success': False, 'message': 'Artwork not found'}), 404
            
            new_image_path = None
            if 'image' in request.files and request.files['image'].filename != '':
                file = request.files['image']
                if not allowed_file(file.filename):
                    return jsonify({'success': False, 'message': 'Invalid file type. Please select: JPG, PNG, GIF, WebP, SVG'}), 400
                    
                file.seek(0, 2)
                file_length = file.tell()
                file.seek(0)
                if file_length > 15 * 1024 * 1024:
                    return jsonify({'success': False, 'message': f'File too large ({file_length // 1024 // 1024}MB). Max size: 15MB'}), 400
                
                filename = file.filename
                ext = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4()}.{ext}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                
                if ext != 'svg':
                    optimized = optimize_image(file)
                    with open(file_path, 'wb') as f:
                        f.write(optimized.read())
                else:
                    file.save(file_path)
                    
                new_image_path = f"static/uploads/{unique_filename}"
                
                old_image = artwork['image_path']
                if old_image.startswith('static/uploads/') and os.path.exists(old_image):
                    try:
                        os.remove(old_image)
                    except OSError:
                        pass
                
                conn.execute(
                    'UPDATE artworks SET title = ?, description = ?, image_path = ? WHERE id = ?',
                    (title if title else None, description, new_image_path, id)
                )
            else:
                conn.execute(
                    'UPDATE artworks SET title = ?, description = ? WHERE id = ?',
                    (title if title else None, description, id)
                )
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Artwork updated successfully!',
                'redirect': url_for('index')
            })
            
        except Exception as e:
            if 'file_path' in locals() and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
            return jsonify({'success': False, 'message': f'Failed to update artwork: {str(e)}'}), 500

    @app.route('/delete/<int:id>', methods=['POST'])
    def delete_artwork(id):
        try:
            conn = get_db_connection()
            artwork = conn.execute('SELECT * FROM artworks WHERE id = ?', (id,)).fetchone()
            
            if not artwork:
                return jsonify({'success': False, 'message': 'Artwork not found'}), 404
            
            img_path = artwork['image_path']
            if img_path.startswith('static/uploads/') and os.path.exists(img_path):
                try:
                    os.remove(img_path)
                except OSError:
                    pass
            
            conn.execute('DELETE FROM artworks WHERE id = ?', (id,))
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Artwork deleted successfully!'
            })
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Failed to delete artwork: {str(e)}'}), 500

    @app.route('/get_description/<int:id>')
    def get_description(id):
        try:
            conn = get_db_connection()
            artwork = conn.execute('SELECT title, description FROM artworks WHERE id = ?', (id,)).fetchone()
            conn.close()
            
            if artwork:
                return jsonify({
                    'success': True,
                    'title': artwork['title'] or 'Untitled',
                    'description': artwork['description'] or 'No description available.'
                })
            else:
                return jsonify({'success': False, 'message': 'Artwork not found'}), 404
                
        except Exception as e:
            return jsonify({'success': False, 'message': f'Failed to load description: {str(e)}'}), 500

    @app.route('/update-order', methods=['POST'])
    def update_order():
        try:
            data = request.get_json()
            
            if not data or 'order' not in data:
                return jsonify({'success': False, 'message': 'Invalid data format'}), 400
            
            order = data.get('order', [])
            conn = get_db_connection()
            cur = conn.cursor()
            
            for item in order:
                if 'id' in item and 'position' in item:
                    cur.execute('UPDATE artworks SET position = ? WHERE id = ?', (item['position'], item['id']))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Artwork order updated successfully!'
            })
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Failed to update order: {str(e)}'}), 500

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'success': False, 'message': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'success': False, 'message': 'Internal server error occurred'}), 500