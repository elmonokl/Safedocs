-- Crear base de datos
CREATE DATABASE IF NOT EXISTS safedocs_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE safedocs_db;

-- Tabla de usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    career VARCHAR(100) DEFAULT 'Ingeniería en Computación e Informática',
    profile_picture VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_is_active (is_active),
    INDEX idx_is_online (is_online)
);

-- Tabla de documentos
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category ENUM('academic', 'research', 'project', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    downloads_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_downloads_count (downloads_count),
    FULLTEXT idx_search (title, description)
);

-- Tabla de solicitudes de amistad
CREATE TABLE friend_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friend_request (sender_id, receiver_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_status (status)
);

-- Tabla de amigos (relación muchos a muchos)
CREATE TABLE friendships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user_id, friend_id),
    INDEX idx_user_id (user_id),
    INDEX idx_friend_id (friend_id)
);

-- Tabla de tokens de restablecimiento de contraseña
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used (used)
);

-- Tabla de sesiones de usuario
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_expires_at (expires_at)
);

-- Insertar usuario administrador por defecto
INSERT INTO users (name, email, password, career, role) VALUES 
('Administrador', 'admin@safedocs.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqK6e', 'Ingeniería en Computación e Informática', 'admin');

-- Insertar algunos usuarios de ejemplo
INSERT INTO users (name, email, password, career) VALUES 
('Álvaro Guevara', 'alvaro@safedocs.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqK6e', 'Ingeniería en Computación e Informática'),
('María González', 'maria@safedocs.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqK6e', 'Ingeniería Civil'),
('Carlos Rodríguez', 'carlos@safedocs.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqK6e', 'Medicina'),
('Ana Martínez', 'ana@safedocs.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqK6e', 'Derecho');

-- Crear vistas útiles
CREATE VIEW user_documents AS
SELECT 
    d.*,
    u.name as author_name,
    u.career as author_career,
    u.profile_picture as author_profile_picture
FROM documents d
JOIN users u ON d.user_id = u.id
WHERE u.is_active = TRUE;

CREATE VIEW user_friends AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.career,
    u.profile_picture,
    u.is_online,
    u.last_seen,
    f.created_at as friendship_date
FROM users u
JOIN friendships f ON (u.id = f.friend_id OR u.id = f.user_id)
WHERE u.id != ? AND u.is_active = TRUE;

-- Crear procedimientos almacenados
DELIMITER //

CREATE PROCEDURE GetUserFriends(IN userId INT)
BEGIN
    SELECT 
        u.id,
        u.name,
        u.email,
        u.career,
        u.profile_picture,
        u.is_online,
        u.last_seen,
        f.created_at as friendship_date
    FROM users u
    JOIN friendships f ON (u.id = f.friend_id OR u.id = f.user_id)
    WHERE (f.user_id = userId OR f.friend_id = userId) 
    AND u.id != userId 
    AND u.is_active = TRUE;
END //

CREATE PROCEDURE SearchUsers(IN searchQuery VARCHAR(100), IN currentUserId INT)
BEGIN
    SELECT 
        u.id,
        u.name,
        u.email,
        u.career,
        u.profile_picture,
        u.is_online,
        u.last_seen,
        CASE 
            WHEN EXISTS(SELECT 1 FROM friendships f WHERE (f.user_id = currentUserId AND f.friend_id = u.id) OR (f.user_id = u.id AND f.friend_id = currentUserId)) THEN 'friend'
            WHEN EXISTS(SELECT 1 FROM friend_requests fr WHERE fr.sender_id = currentUserId AND fr.receiver_id = u.id AND fr.status = 'pending') THEN 'sent'
            WHEN EXISTS(SELECT 1 FROM friend_requests fr WHERE fr.sender_id = u.id AND fr.receiver_id = currentUserId AND fr.status = 'pending') THEN 'received'
            ELSE 'none'
        END as friendship_status
    FROM users u
    WHERE u.id != currentUserId 
    AND u.is_active = TRUE
    AND (u.name LIKE CONCAT('%', searchQuery, '%') OR u.email LIKE CONCAT('%', searchQuery, '%'))
    ORDER BY u.name;
END //

CREATE PROCEDURE GetPopularDocuments(IN limitCount INT)
BEGIN
    SELECT 
        d.*,
        u.name as author_name,
        u.career as author_career
    FROM documents d
    JOIN users u ON d.user_id = u.id
    WHERE u.is_active = TRUE
    ORDER BY d.downloads_count DESC, d.created_at DESC
    LIMIT limitCount;
END //

DELIMITER ; 