from PIL import Image
import os

# 输入原图路径
input_image_path = "source.png"  # 替换成你的图片文件名
# 输出目录
output_dir = "icons"
os.makedirs(output_dir, exist_ok=True)

# PWA 推荐尺寸
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

# 打开原图
img = Image.open(input_image_path)

# 确保原图为正方形（裁剪为最短边）
min_side = min(img.size)
img = img.crop((0, 0, min_side, min_side))

for size in sizes:
    # 使用 Resampling.LANCZOS 替代 ANTIALIAS
    resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
    output_path = os.path.join(output_dir, f"icon-{size}.png")
    resized_img.save(output_path)
    print(f"生成 {output_path}")

print("全部图标生成完毕！")
