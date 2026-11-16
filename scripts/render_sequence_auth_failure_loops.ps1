param(
  [string]$OutFile = "C:\Users\Son\Documents\GitHub\DA2\bao-cao\uml\sequence-dang-ky-dang-nhap-that-bai-loop.png"
)

Add-Type -AssemblyName System.Drawing

$width = 2200
$height = 1900
$bmp = [System.Drawing.Bitmap]::new($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)

$black = [System.Drawing.Brushes]::Black
$white = [System.Drawing.Brushes]::White
$blackPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2.2)
$thinPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.5)
$dashPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2)
$dashPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$framePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.8)
$framePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$lifelinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.7)
$lifelinePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$activationPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2)
$fontTitle = [System.Drawing.Font]::new("Arial", 30, [System.Drawing.FontStyle]::Bold)
$fontSubtitle = [System.Drawing.Font]::new("Arial", 16)
$fontParticipant = [System.Drawing.Font]::new("Arial", 16, [System.Drawing.FontStyle]::Bold)
$fontMessage = [System.Drawing.Font]::new("Arial", 15)
$fontFrame = [System.Drawing.Font]::new("Arial", 16, [System.Drawing.FontStyle]::Bold)

function Center-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font, [System.Drawing.Brush]$Brush = $black)
  $size = $g.MeasureString($Text, $Font)
  $g.DrawString($Text, $Font, $Brush, $X - ($size.Width / 2), $Y)
}

function Label-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font)
  $size = $g.MeasureString($Text, $Font)
  $padX = 8
  $padY = 3
  $rect = [System.Drawing.RectangleF]::new($X - ($size.Width / 2) - $padX, $Y - $padY, $size.Width + (2 * $padX), $size.Height + (2 * $padY))
  $g.FillRectangle($white, $rect)
  $g.DrawString($Text, $Font, $black, $rect.X + $padX, $rect.Y + $padY)
}

function Draw-Arrow {
  param([float]$X1, [float]$Y, [float]$X2, [bool]$Return = $false)
  $pen = if ($Return) { $dashPen } else { $blackPen }
  $g.DrawLine($pen, $X1, $Y, $X2, $Y)
  $direction = if ($X2 -gt $X1) { 1 } else { -1 }
  $head = 12
  $g.DrawLine($blackPen, $X2, $Y, $X2 - ($direction * $head), $Y - 7)
  $g.DrawLine($blackPen, $X2, $Y, $X2 - ($direction * $head), $Y + 7)
}

function Draw-Message {
  param([float]$X1, [float]$Y, [float]$X2, [string]$Text, [bool]$Return = $false)
  Draw-Arrow -X1 $X1 -Y $Y -X2 $X2 -Return $Return
  Label-Text -Text $Text -X (($X1 + $X2) / 2) -Y ($Y - 22) -Font $fontMessage
}

function Draw-Note {
  param([float]$X, [float]$Y, [float]$W, [string[]]$Lines)
  $h = 20 + ($Lines.Count * 20)
  $g.FillRectangle($white, $X, $Y, $W, $h)
  $g.DrawRectangle($thinPen, $X, $Y, $W, $h)
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    Center-Text -Text $Lines[$i] -X ($X + ($W / 2)) -Y ($Y + 5 + ($i * 20)) -Font $fontMessage
  }
}

function Draw-Frame {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [string]$Label)
  $g.DrawRectangle($framePen, $X, $Y, $W, $H)
  $size = $g.MeasureString($Label, $fontFrame)
  $g.FillRectangle($white, $X + 12, $Y - 2, $size.Width + 16, $size.Height + 5)
  $g.DrawString($Label, $fontFrame, $black, $X + 20, $Y + 1)
}

Center-Text -Text "Sequence Diagram — Đăng ký và đăng nhập thất bại" -X 1100 -Y 25 -Font $fontTitle
Center-Text -Text "Mỗi khung loop lặp lại khi người dùng sửa thông tin và chọn thử lại" -X 1100 -Y 62 -Font $fontSubtitle
$g.DrawLine($blackPen, 60, 95, 2140, 95)

$xs = @(190, 600, 1000, 1400, 1810)
$names = @("Người dùng", "React Auth UI", "AuthContext", "Express API", "MongoDB")
for ($i = 0; $i -lt $xs.Count; $i++) {
  $x = $xs[$i]
  $g.FillRectangle($white, $x - 125, 115, 250, 58)
  $g.DrawRectangle($blackPen, $x - 125, 115, 250, 58)
  Center-Text -Text $names[$i] -X $x -Y 134 -Font $fontParticipant
  $g.DrawLine($lifelinePen, $x, 173, $x, 1810)
}

# Registration failure loop
Draw-Frame -X 65 -Y 205 -W 2070 -H 680 -Label "loop [Đăng ký thất bại và người dùng chọn thử lại]"
Center-Text -Text "ĐĂNG KÝ — TÀI KHOẢN HOẶC EMAIL ĐÃ TỒN TẠI" -X 1100 -Y 225 -Font $fontFrame

foreach ($bar in @(@(591,275,18,510), @(991,330,18,455), @(1391,385,18,400))) {
  $g.FillRectangle($white, $bar[0], $bar[1], $bar[2], $bar[3])
  $g.DrawRectangle($activationPen, $bar[0], $bar[1], $bar[2], $bar[3])
}

Draw-Message 190 285 600 "Nhập thông tin đăng ký"
Draw-Message 600 345 1000 "Gửi yêu cầu đăng ký"
Draw-Message 1000 405 1400 "POST /api/register"
Draw-Message 1400 465 1810 "Kiểm tra username/email"
Draw-Message 1810 525 1400 "Tài khoản hoặc email đã tồn tại" $true
Draw-Message 1400 595 1000 "HTTP 400 – Tên đăng nhập hoặc email đã tồn tại" $true
Draw-Message 1000 665 600 "Hiển thị thông báo lỗi" $true
Draw-Message 600 735 190 "Yêu cầu sửa và gửi lại thông tin" $true
Center-Text -Text "Vòng lặp quay lại bước ‘Nhập thông tin đăng ký’." -X 1100 -Y 820 -Font $fontSubtitle

$g.DrawLine($thinPen, 60, 930, 2140, 930)
Center-Text -Text "ĐĂNG NHẬP" -X 1100 -Y 945 -Font $fontFrame

# Login failure loop
Draw-Frame -X 65 -Y 975 -W 2070 -H 680 -Label "loop [Đăng nhập thất bại và người dùng chọn thử lại]"

foreach ($bar in @(@(591,1045,18,510), @(991,1100,18,455), @(1391,1155,18,400))) {
  $g.FillRectangle($white, $bar[0], $bar[1], $bar[2], $bar[3])
  $g.DrawRectangle($activationPen, $bar[0], $bar[1], $bar[2], $bar[3])
}

Draw-Message 190 1055 600 "Nhập lại thông tin đăng nhập"
Draw-Message 600 1115 1000 "Gửi yêu cầu đăng nhập"
Draw-Message 1000 1175 1400 "POST /api/login"
Draw-Message 1400 1235 1810 "Tìm tài khoản theo username"
Draw-Message 1810 1295 1400 "Trả về User hoặc null" $true
Draw-Note 1430 1320 300 @("Kiểm tra tài khoản và", "so sánh mật khẩu bằng bcrypt")
Draw-Message 1400 1390 1000 "Tài khoản không tồn tại hoặc mật khẩu không chính xác" $true
Draw-Message 1000 1460 600 "Hiển thị thông báo lỗi" $true
Draw-Message 600 1530 190 "Yêu cầu nhập lại thông tin" $true
Center-Text -Text "Vòng lặp quay lại bước ‘Nhập lại thông tin đăng nhập’." -X 1100 -Y 1605 -Font $fontSubtitle

Center-Text -Text "Mũi tên liền: yêu cầu/thao tác  •  Mũi tên đứt: kết quả trả về" -X 1100 -Y 1740 -Font $fontSubtitle
Center-Text -Text "Khi người dùng nhập đúng thông tin, thay nhánh lỗi bằng phản hồi thành công và dùng break để thoát loop." -X 1100 -Y 1775 -Font $fontSubtitle

$directory = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
$bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$blackPen.Dispose()
$thinPen.Dispose()
$dashPen.Dispose()
$framePen.Dispose()
$lifelinePen.Dispose()
$activationPen.Dispose()
Write-Output $OutFile
