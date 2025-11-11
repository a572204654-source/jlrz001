-- 创建文件上传表 (file_uploads) - 用于AI文件上传
-- 如果表已存在，先删除再创建

USE `jlzr1101-5g9kplxza13a780d`;

DROP TABLE IF EXISTS `file_uploads`;

CREATE TABLE `file_uploads` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `file_id` varchar(100) NOT NULL DEFAULT '' COMMENT '文件唯一标识ID',
  `user_id` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '上传用户ID',
  `file_name` varchar(500) NOT NULL DEFAULT '' COMMENT '文件名',
  `file_type` varchar(50) NOT NULL DEFAULT 'document' COMMENT '文件类型：image/document/video',
  `file_size` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
  `file_url` varchar(1000) NOT NULL DEFAULT '' COMMENT '文件访问URL（云存储）',
  `doubao_file_id` varchar(200) NOT NULL DEFAULT '' COMMENT '豆包文件ID',
  `upload_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_file_id` (`file_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_doubao_file_id` (`doubao_file_id`),
  KEY `idx_upload_time` (`upload_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件上传表（AI文件上传）';

-- 创建完成
SELECT '文件上传表创建成功' AS result;

